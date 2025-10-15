# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import asyncio
import datetime
import io
import logging
import math
import os
import shutil
import sys
import uuid
from concurrent.futures import (
    ProcessPoolExecutor,
    ThreadPoolExecutor,
    as_completed,
)
from typing import List, Optional

from fastapi import HTTPException, UploadFile, status
from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud.logging import Client as LoggerClient
from google.cloud.logging.handlers import CloudLoggingHandler
from pypdf import PdfReader, PdfWriter

from src.auth.iam_signer_credentials_service import IamSignerCredentials
from src.brand_guidelines.dto.brand_guideline_response_dto import (
    BrandGuidelineResponseDto,
)
from src.brand_guidelines.dto.brand_guideline_search_dto import (
    BrandGuidelineSearchDto,
)
from src.brand_guidelines.repository.brand_guideline_repository import (
    BrandGuidelineRepository,
)
from src.brand_guidelines.schema.brand_guideline_model import (
    BrandGuidelineModel,
)
from src.common.schema.media_item_model import JobStatusEnum
from src.common.storage_service import GcsService
from src.multimodal.gemini_service import GeminiService
from src.users.user_model import UserModel, UserRoleEnum
from src.workspaces.repository.workspace_repository import WorkspaceRepository

logger = logging.getLogger(__name__)

# Gemini API has a 50 MiB limit for PDF files.
GEMINI_PDF_LIMIT_BYTES = 50 * 1024 * 1024


def _process_brand_guideline_in_background(
    guideline_id: str,
    name: str,
    file_contents: bytes,
    original_filename: str,
    workspace_id: Optional[str],
):
    """
    This is the long-running worker task that runs in a separate process.
    It handles PDF splitting, uploading, AI extraction, and database updates.
    """
    worker_logger = logging.getLogger(f"brand_guideline_worker.{guideline_id}")
    worker_logger.setLevel(logging.INFO)

    try:
        # --- HYBRID LOGGING SETUP FOR THE WORKER PROCESS ---
        if worker_logger.hasHandlers():
            worker_logger.handlers.clear()

        if os.getenv("ENVIRONMENT") == "production":
            log_client = LoggerClient()
            handler = CloudLoggingHandler(
                log_client, name=f"brand_guideline_worker.{guideline_id}"
            )
            worker_logger.addHandler(handler)
        else:
            handler = logging.StreamHandler(sys.stdout)
            formatter = logging.Formatter(
                "%(asctime)s - [BG_WORKER] - %(levelname)s - %(message)s"
            )
            handler.setFormatter(formatter)
            worker_logger.addHandler(handler)

        # Create new instances of dependencies within this process
        repo = BrandGuidelineRepository()
        gcs_service = GcsService()
        gemini_service = GeminiService()

        try:
            # 1. Split if necessary and upload file(s) to GCS
            gcs_uris = asyncio.run(
                BrandGuidelineService._split_and_upload_pdf(
                    gcs_service,
                    file_contents,
                    workspace_id,
                    original_filename,
                )
            )

            if not gcs_uris:
                raise Exception(
                    "Failed to upload PDF chunk(s) to Google Cloud Storage."
                )

            worker_logger.info(
                f"PDF(s) uploaded to {gcs_uris}. Starting AI extraction."
            )

            # 2. Call Gemini for each chunk to extract structured data
            # Use a ThreadPoolExecutor to run extractions in parallel.
            successful_partial_results = []
            with ThreadPoolExecutor(max_workers=len(gcs_uris)) as executor:
                # Create a future for each extraction task
                future_to_uri = {
                    executor.submit(
                        gemini_service.extract_brand_info_from_pdf, uri
                    ): uri
                    for uri in gcs_uris
                }

                for future in as_completed(future_to_uri):
                    uri = future_to_uri[future]
                    try:
                        result = future.result()
                        if result:
                            successful_partial_results.append(result)
                    except Exception as exc:
                        worker_logger.error(
                            f"Extraction for PDF chunk {uri} failed: {exc}"
                        )

            # 3. Aggregate the results
            extracted_data: BrandGuidelineModel | None = (
                gemini_service.aggregate_brand_info(successful_partial_results)
            )

            if not extracted_data:
                worker_logger.error(
                    f"Failed to extract data from PDF at {gcs_uris}."
                )
                raise Exception(
                    "AI processing failed to extract data from the PDF."
                )

            # 4. Update the final, fully-populated Firestore document
            update_data = {
                "status": JobStatusEnum.COMPLETED,
                "source_pdf_gcs_uris": gcs_uris,
                "color_palette": extracted_data.color_palette,
                "tone_of_voice_summary": extracted_data.tone_of_voice_summary,
                "visual_style_summary": extracted_data.visual_style_summary,
                "guideline_text": extracted_data.guideline_text,
            }
            repo.update(guideline_id, update_data)
            worker_logger.info(
                f"Successfully processed brand guideline: {guideline_id}"
            )

        except Exception as e:
            worker_logger.error(
                "Brand guideline processing task failed.",
                extra={
                    "json_fields": {
                        "guideline_id": guideline_id,
                        "error": str(e),
                    }
                },
                exc_info=True,
            )
            # --- ON FAILURE, UPDATE THE DOCUMENT WITH AN ERROR STATUS ---
            error_update_data = {
                "status": JobStatusEnum.FAILED,
                "error_message": str(e),
            }
            repo.update(guideline_id, error_update_data)

    except Exception as e:
        worker_logger.error(
            "Brand guideline worker failed to initialize.",
            extra={
                "json_fields": {"guideline_id": guideline_id, "error": str(e)}
            },
            exc_info=True,
        )


class BrandGuidelineService:
    """
    Handles the business logic for creating and managing brand guidelines,
    including PDF processing via background tasks.
    """

    def __init__(self):
        self.repo = BrandGuidelineRepository()
        self.gcs_service = GcsService()
        self.gemini_service = GeminiService()
        self.workspace_repo = WorkspaceRepository()
        self.iam_signer_credentials = IamSignerCredentials()

    @staticmethod
    async def _split_and_upload_pdf(
        gcs_service: GcsService,
        file_contents: bytes,
        workspace_id: Optional[str],
        original_filename: str,
    ) -> list[str]:
        """
        Splits a large PDF into chunks that are under the size limit,
        uploads them to GCS, and returns their GCS URIs.
        """
        file_size = len(file_contents)
        timestamp = datetime.datetime.now(datetime.timezone.utc).strftime(
            "%Y%m%d%H%M%S"
        )
        file_uuid = uuid.uuid4()

        if file_size <= GEMINI_PDF_LIMIT_BYTES:
            # No splitting needed, upload the single file
            destination_blob_name = f"brand-guidelines/{workspace_id or 'global'}/{timestamp}-{file_uuid}-{original_filename}"
            # Run the single upload in a thread to keep the function async
            gcs_uri = await asyncio.to_thread(
                gcs_service.upload_bytes_to_gcs,
                file_contents,
                destination_blob_name=destination_blob_name,
                mime_type="application/pdf",
            )
            return [gcs_uri] if gcs_uri else []

        # Splitting is required
        logger.info(
            f"PDF size ({file_size} bytes) exceeds limit. Splitting file."
        )
        reader = PdfReader(io.BytesIO(file_contents))
        num_pages = len(reader.pages)
        num_chunks = math.ceil(file_size / GEMINI_PDF_LIMIT_BYTES)
        pages_per_chunk = math.ceil(num_pages / num_chunks)

        upload_tasks = []
        for i in range(num_chunks):
            writer = PdfWriter()
            start_page = i * pages_per_chunk
            end_page = min(start_page + pages_per_chunk, num_pages)
            for page_num in range(start_page, end_page):
                writer.add_page(reader.pages[page_num])

            with io.BytesIO() as chunk_bytes_io:
                writer.write(chunk_bytes_io)
                chunk_bytes = chunk_bytes_io.getvalue()

            chunk_filename = (
                f"{timestamp}-{file_uuid}-part-{i+1}-{original_filename}"
            )
            dest_blob_name = (
                f"brand-guidelines/{workspace_id or 'global'}/{chunk_filename}"
            )
            upload_tasks.append(
                asyncio.to_thread(
                    gcs_service.upload_bytes_to_gcs,
                    chunk_bytes,
                    destination_blob_name=dest_blob_name,
                    mime_type="application/pdf",
                )
            )

        return await asyncio.gather(*upload_tasks)

    async def _delete_guideline_and_assets(
        self, guideline: BrandGuidelineModel
    ):
        """Deletes a guideline document and all its associated GCS assets."""
        logger.info(f"Deleting old guideline '{guideline.id}' and its assets.")

        # Delete all associated PDF chunks from GCS concurrently
        delete_tasks = [
            asyncio.to_thread(self.gcs_service.delete_blob_from_uri, uri)
            for uri in guideline.source_pdf_gcs_uris
        ]
        await asyncio.gather(*delete_tasks)

        # Delete the Firestore document
        if guideline.id:
            await asyncio.to_thread(self.repo.delete, guideline.id)

    async def _create_brand_guideline_response(
        self, guideline: BrandGuidelineModel
    ) -> BrandGuidelineResponseDto:
        """
        Enriches a BrandGuidelineModel with presigned URLs for its assets.
        """
        presigned_url_tasks = [
            asyncio.to_thread(
                self.iam_signer_credentials.generate_presigned_url, uri
            )
            for uri in guideline.source_pdf_gcs_uris
        ]
        presigned_urls = await asyncio.gather(*presigned_url_tasks)

        return BrandGuidelineResponseDto(
            **guideline.model_dump(), presigned_source_pdf_urls=presigned_urls
        )

    async def start_brand_guideline_processing_job(
        self,
        name: str,
        file: UploadFile,
        workspace_id: Optional[str],
        current_user: UserModel,
        executor: ProcessPoolExecutor,
    ) -> BrandGuidelineResponseDto:
        """
        Creates a placeholder for a brand guideline and starts the processing
        in a background job.
        """
        # 1. Authorization Check
        is_system_admin = UserRoleEnum.ADMIN in current_user.roles

        if workspace_id:
            workspace = self.workspace_repo.get_by_id(workspace_id)
            if not workspace:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Workspace with ID '{workspace_id}' not found.",
                )

            is_workspace_owner = current_user.id == workspace.owner_id
            if not (is_system_admin or is_workspace_owner):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the workspace owner or a system admin can add brand guidelines.",
                )
        elif not is_system_admin:
            # If no workspace is specified, it's a global guideline, which only admins can create.
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only a system admin can create global brand guidelines.",
            )

        # 2. Check for and delete an existing guideline for the workspace
        if workspace_id:
            search_dto = BrandGuidelineSearchDto(
                workspace_id=workspace_id, limit=1
            )
            workspace_filter = FieldFilter("workspace_id", "==", workspace_id)
            existing_guidelines_response = await asyncio.to_thread(
                self.repo.query, search_dto, extra_filters=[workspace_filter]
            )
            if existing_guidelines_response.data:
                await self._delete_guideline_and_assets(
                    existing_guidelines_response.data[0]
                )

        # 3. Read file contents into memory for the background process
        file_contents = await file.read()

        # 4. Create and save a placeholder document
        guideline_id = str(uuid.uuid4())
        placeholder_guideline = BrandGuidelineModel(
            id=guideline_id,
            name=name,
            workspace_id=workspace_id,
            status=JobStatusEnum.PROCESSING,
        )
        self.repo.save(placeholder_guideline)

        # 5. Submit the job to the background process pool
        executor.submit(
            _process_brand_guideline_in_background,
            guideline_id=guideline_id,
            name=name,
            file_contents=file_contents,
            original_filename=file.filename or "guideline.pdf",
            workspace_id=workspace_id,
        )

        logger.info(
            f"Brand guideline processing job queued: {placeholder_guideline.id}"
        )

        # 6. Return the placeholder DTO to the client
        return await self._create_brand_guideline_response(
            placeholder_guideline
        )

    async def get_guideline_by_id(
        self, guideline_id: str, current_user: UserModel
    ) -> Optional[BrandGuidelineResponseDto]:
        """
        Retrieves a single brand guideline and performs an authorization check.
        """
        guideline = await asyncio.to_thread(self.repo.get_by_id, guideline_id)

        if not guideline:
            return None

        is_system_admin = UserRoleEnum.ADMIN in current_user.roles

        # Global guidelines can be seen by any authenticated user
        if not guideline.workspace_id:
            return await self._create_brand_guideline_response(guideline)

        # For workspace-specific guidelines, check membership.
        workspace = await asyncio.to_thread(
            self.workspace_repo.get_by_id, guideline.workspace_id
        )

        if not workspace:
            # This indicates an data inconsistency, but we handle it gracefully.
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent workspace for this guideline not found.",
            )

        if not is_system_admin and current_user.id not in workspace.member_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this brand guideline.",
            )

        return await self._create_brand_guideline_response(guideline)

    async def get_guideline_by_workspace_id(
        self, workspace_id: str, current_user: UserModel
    ) -> Optional[BrandGuidelineResponseDto]:
        """
        Retrieves the unique brand guideline for a workspace.
        """
        workspace = await asyncio.to_thread(
            self.workspace_repo.get_by_id, workspace_id
        )
        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Workspace with ID '{workspace_id}' not found.",
            )

        is_system_admin = UserRoleEnum.ADMIN in current_user.roles
        if not is_system_admin and current_user.id not in workspace.member_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this workspace.",
            )

        search_dto = BrandGuidelineSearchDto(workspace_id=workspace_id, limit=1)
        workspace_filter = FieldFilter("workspace_id", "==", workspace_id)
        response = await asyncio.to_thread(
            self.repo.query, search_dto, extra_filters=[workspace_filter]
        )

        if not response.data:
            return None

        return await self._create_brand_guideline_response(response.data[0])

    async def delete_guideline(
        self, guideline_id: str, current_user: UserModel
    ):
        """
        Deletes a brand guideline and all its associated assets after an
        authorization check.
        """
        # 1. Fetch the guideline
        guideline = await asyncio.to_thread(self.repo.get_by_id, guideline_id)
        if not guideline:
            # If it doesn't exist, we can consider the deletion successful.
            logger.warning(
                f"Attempted to delete non-existent guideline with ID: {guideline_id}"
            )
            return

        # 2. Authorization Check
        is_system_admin = UserRoleEnum.ADMIN in current_user.roles

        # Global guidelines can only be deleted by admins
        if not guideline.workspace_id:
            if not is_system_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only a system admin can delete global brand guidelines.",
                )
        else:  # Workspace-specific guideline
            workspace = await asyncio.to_thread(
                self.workspace_repo.get_by_id, guideline.workspace_id
            )
            # If workspace doesn't exist, only admin can clean up the orphan guideline.
            if not workspace and not is_system_admin:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent workspace for this guideline not found.",
                )

            is_workspace_owner = (
                workspace and current_user.id == workspace.owner_id
            )
            if not (is_system_admin or is_workspace_owner):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the workspace owner or a system admin can delete this brand guideline.",
                )

        # 3. Perform deletion
        await self._delete_guideline_and_assets(guideline)

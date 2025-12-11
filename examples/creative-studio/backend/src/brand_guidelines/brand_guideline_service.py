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
from google.cloud.logging import Client as LoggerClient
from google.cloud.logging.handlers import CloudLoggingHandler
from pypdf import PdfReader, PdfWriter

from src.workspaces.schema.workspace_model import WorkspaceScopeEnum
from src.auth.iam_signer_credentials_service import IamSignerCredentials
from src.brand_guidelines.dto.brand_guideline_response_dto import (
    BrandGuidelineResponseDto,
)
from src.brand_guidelines.dto.brand_guideline_search_dto import (
    BrandGuidelineSearchDto,
)
from src.brand_guidelines.dto.finalize_upload_dto import FinalizeUploadDto
from src.brand_guidelines.dto.generate_upload_url_dto import (
    GenerateUploadUrlDto,
    GenerateUploadUrlResponseDto,
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
from fastapi import Depends

logger = logging.getLogger(__name__)

# Gemini API has a 50 MiB limit for PDF files.
GEMINI_PDF_LIMIT_BYTES = 50 * 1024 * 1024


def _process_brand_guideline_in_background(
    guideline_id: int,
    name: str,
    original_filename: str,
    source_gcs_uri: str,
    workspace_id: Optional[int],
):
    """
    This is the long-running worker task that runs in a separate process.
    It handles PDF splitting, uploading, AI extraction, and database updates.
    """
    import asyncio
    import os
    import sys
    from google.cloud.logging import Client as LoggerClient
    from google.cloud.logging.handlers import CloudLoggingHandler
    from src.database import WorkerDatabase

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
                "%(asctime)s - [BRAND_GUIDELINE_WORKER] - %(levelname)s - %(message)s"
            )
            handler.setFormatter(formatter)
            worker_logger.addHandler(handler)

        # Create a new event loop for this process
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        async def _async_worker():
            async with WorkerDatabase() as db_factory:
                async with db_factory() as db:
                    # Create new instances of dependencies within this process
                    repo = BrandGuidelineRepository(db)
                    gcs_service = GcsService()
                    # GeminiService needs brand_guideline_repo
                    gemini_service = GeminiService(brand_guideline_repo=repo)

                    try:
                        # 0. Download the source PDF from GCS
                        worker_logger.info(f"Downloading source PDF from {source_gcs_uri}")
                        file_contents = gcs_service.download_bytes_from_gcs(source_gcs_uri)

                        # 1. Split if necessary and upload file(s) to GCS
                        gcs_uris = await BrandGuidelineService._split_and_upload_pdf(
                            gcs_service,
                            file_contents or b"",
                            workspace_id,
                            original_filename,
                        )

                        if not gcs_uris:
                            raise Exception(
                                "Failed to upload PDF chunk(s) to Google Cloud Storage."
                            )

                        worker_logger.info(
                            f"PDF(s) uploaded to {gcs_uris}. Starting AI extraction."
                        )

                        # 2. Call Gemini for each chunk to extract structured data
                        # Use a ThreadPoolExecutor to run extractions in parallel if needed,
                        # but here we use asyncio.gather with run_in_executor for potentially sync parts
                        # or just await if they are async.
                        # Assuming extract_brand_info_from_pdf is synchronous (based on previous usage),
                        # we run it in an executor.
                        
                        loop = asyncio.get_running_loop()
                        tasks = [
                            loop.run_in_executor(None, gemini_service.extract_brand_info_from_pdf, uri)
                            for uri in gcs_uris
                        ]
                        results = await asyncio.gather(*tasks, return_exceptions=True)

                        successful_partial_results = []
                        for i, result in enumerate(results):
                            if isinstance(result, Exception):
                                worker_logger.error(
                                    f"Extraction for PDF chunk {gcs_uris[i]} failed: {result}"
                                )
                            elif result:
                                successful_partial_results.append(result)

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

                        # 4. Update the final, fully-populated database record
                        update_data = {
                            "status": JobStatusEnum.COMPLETED,
                            "source_pdf_gcs_uris": gcs_uris,
                            "color_palette": extracted_data.color_palette,
                            "tone_of_voice_summary": extracted_data.tone_of_voice_summary,
                            "visual_style_summary": extracted_data.visual_style_summary,
                            "guideline_text": extracted_data.guideline_text,
                        }
                        await repo.update(guideline_id, update_data)
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
                        await repo.update(guideline_id, error_update_data)

        loop.run_until_complete(_async_worker())
        loop.close()

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

    def __init__(
        self,
        repo: BrandGuidelineRepository = Depends(),
        gcs_service: GcsService = Depends(),
        gemini_service: GeminiService = Depends(),
        workspace_repo: WorkspaceRepository = Depends(),
        iam_signer_credentials: IamSignerCredentials = Depends(),
    ):
        self.repo = repo
        self.gcs_service = gcs_service
        self.gemini_service = gemini_service
        self.workspace_repo = workspace_repo
        self.iam_signer_credentials = iam_signer_credentials

    @staticmethod
    async def _split_and_upload_pdf(
        gcs_service: GcsService,
        file_contents: bytes,
        workspace_id: Optional[int],
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
            await self.repo.delete(guideline.id)

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

    async def generate_signed_upload_url(
        self, request_dto: GenerateUploadUrlDto, current_user: UserModel
    ) -> GenerateUploadUrlResponseDto:
        """
        Generates a GCS v4 signed URL for a client-side upload.
        """
        # Authorize the user for the workspace before generating a URL
        if request_dto.workspace_id:
            workspace = await self.workspace_repo.get_by_id(request_dto.workspace_id)
            if not workspace:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Workspace with ID '{request_dto.workspace_id}' not found.",
                )

        file_uuid = uuid.uuid4()
        destination_blob_name = f"brand-guidelines/{request_dto.workspace_id or 'global'}/uploads/{file_uuid}/{request_dto.filename}"

        signed_url, gcs_uri = await asyncio.to_thread(
            self.iam_signer_credentials.generate_v4_upload_signed_url,
            destination_blob_name,
            request_dto.content_type,
            self.gcs_service.bucket_name,
        )

        if not signed_url or not gcs_uri:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Could not generate upload URL.",
            )

        return GenerateUploadUrlResponseDto(
            upload_url=signed_url, gcs_uri=gcs_uri
        )

    async def start_brand_guideline_processing_job(
        self,
        name: str,
        workspace_id: Optional[int],
        gcs_uri: str,
        original_filename: str,
        current_user: UserModel,
        executor: ThreadPoolExecutor,
    ) -> BrandGuidelineResponseDto:
        """
        Creates a placeholder for a brand guideline and starts the processing
        in a background job.
        """
        # 1. Authorization Check
        is_system_admin = UserRoleEnum.ADMIN in current_user.roles

        if workspace_id:
            workspace = await self.workspace_repo.get_by_id(workspace_id)
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
            existing_guidelines_response = await self.repo.query(
                search_dto, workspace_id=workspace_id
            )
            if existing_guidelines_response.data:
                await self._delete_guideline_and_assets(
                    existing_guidelines_response.data[0]
                )

        # 4. Create and save a placeholder document
        placeholder_guideline = BrandGuidelineModel(
            name=name,
            workspace_id=workspace_id,
            status=JobStatusEnum.PROCESSING,
            source_pdf_gcs_uris=[gcs_uri],  # Store the initial upload URI
        )
        placeholder_guideline = await self.repo.create(placeholder_guideline)

        # 5. Submit the job to the background process pool
        executor.submit(
            _process_brand_guideline_in_background,
            guideline_id=placeholder_guideline.id,
            name=name,
            original_filename=original_filename,
            workspace_id=workspace_id,
            source_gcs_uri=gcs_uri,
        )

        logger.info(
            f"Brand guideline processing job queued: {placeholder_guideline.id}"
        )

        # 6. Return the placeholder DTO to the client
        return await self._create_brand_guideline_response(
            placeholder_guideline
        )

    async def get_guideline_by_id(
        self, guideline_id: int, current_user: UserModel
    ) -> Optional[BrandGuidelineResponseDto]:
        """
        Retrieves a single brand guideline and performs an authorization check.
        """
        guideline = await self.repo.get_by_id(guideline_id)

        if not guideline:
            return None

        is_system_admin = UserRoleEnum.ADMIN in current_user.roles

        # Global guidelines can be seen by any authenticated user
        if not guideline.workspace_id:
            return await self._create_brand_guideline_response(guideline)

        # For workspace-specific guidelines, check membership.
        workspace = await self.workspace_repo.get_by_id(guideline.workspace_id)

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
        self, workspace_id: int, current_user: UserModel
    ) -> Optional[BrandGuidelineResponseDto]:
        """
        Retrieves the unique brand guideline for a workspace.
        """
        workspace = await self.workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Workspace with ID '{workspace_id}' not found.",
            )

        if not workspace.scope == WorkspaceScopeEnum.PUBLIC:
            is_system_admin = UserRoleEnum.ADMIN in current_user.roles
            if (
                not is_system_admin
                and current_user.id not in workspace.member_ids
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not a member of this workspace.",
                )

        search_dto = BrandGuidelineSearchDto(workspace_id=workspace_id, limit=1)
        response = await self.repo.query(
            search_dto, workspace_id=workspace_id
        )

        if not response.data:
            return None

        return await self._create_brand_guideline_response(response.data[0])

    async def delete_guideline(
        self, guideline_id: int, current_user: UserModel
    ):
        """
        Deletes a brand guideline and all its associated assets after an
        authorization check.
        """
        # 1. Fetch the guideline
        guideline = await self.repo.get_by_id(guideline_id)
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
            workspace = await self.workspace_repo.get_by_id(guideline.workspace_id)
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

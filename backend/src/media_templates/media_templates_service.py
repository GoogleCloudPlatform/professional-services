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
import hashlib
import io
import os
from typing import List, Optional

from fastapi import Depends, HTTPException, UploadFile, status
from starlette.datastructures import Headers

from src.auth.iam_signer_credentials_service import IamSignerCredentials
from src.common.base_dto import MimeTypeEnum
from src.common.dto.pagination_response_dto import PaginationResponseDto
from src.common.schema.media_item_model import (
    SourceAssetLink,
    SourceMediaItemLink,
)
from src.common.storage_service import GcsService
from src.galleries.dto.gallery_response_dto import SourceAssetLinkResponse
from src.images.repository.media_item_repository import MediaRepository
from src.media_templates.dto.create_prompt_template_dto import (
    CreatePromptTemplateDto,
)
from src.media_templates.dto.media_template_response_dto import (
    MediaTemplateResponse,
)
from src.media_templates.dto.template_search_dto import TemplateSearchDto
from src.media_templates.dto.update_template_dto import UpdateTemplateDto
from src.media_templates.repository.media_template_repository import (
    MediaTemplateRepository,
)
from src.media_templates.schema.media_template_model import (
    GenerationParameters,
    MediaTemplateModel,
)

# We need Gemini to auto-generate names and descriptions
from src.multimodal.gemini_service import (
    GeminiService,
    PromptTargetEnum,
    ResponseMimeTypeEnum,
)
from src.source_assets.repository.source_asset_repository import (
    SourceAssetRepository,
)
from src.source_assets.schema.source_asset_model import (
    AssetScopeEnum,
    AssetTypeEnum,
)
from src.source_assets.source_asset_service import SourceAssetService
from src.users.user_model import UserModel
from src.workspaces.repository.workspace_repository import WorkspaceRepository


class MediaTemplateService:
    """Handles the business logic for managing media templates."""

    def __init__(
        self,
        template_repo: MediaTemplateRepository = Depends(),
        media_item_repo: MediaRepository = Depends(),
        source_asset_repo: SourceAssetRepository = Depends(),
        gemini_service: GeminiService = Depends(),
        iam_signer_credentials: IamSignerCredentials = Depends(),
        gcs_service: GcsService = Depends(),
        source_asset_service: SourceAssetService = Depends(),
        workspace_repo: WorkspaceRepository = Depends(),
    ):
        # Dependency Injection for repositories and other services
        self.template_repo = template_repo
        self.media_item_repo = media_item_repo
        self.source_asset_repo = source_asset_repo
        self.gemini_service = gemini_service
        self.iam_signer_credentials = iam_signer_credentials
        self.gcs_service = gcs_service
        self.source_asset_service = source_asset_service
        self.workspace_repo = workspace_repo

    async def _enrich_source_asset_link(
        self, link: SourceAssetLink
    ) -> Optional[SourceAssetLinkResponse]:
        """
        Fetches the source asset document and generates a presigned URL for it.
        """
        asset_doc = await self.source_asset_repo.get_by_id(link.asset_id)
        if not asset_doc:
            return None

        presigned_url = await asyncio.to_thread(
            self.iam_signer_credentials.generate_presigned_url,
            asset_doc.gcs_uri,
        )

        return SourceAssetLinkResponse(
            **link.model_dump(),
            presigned_url=presigned_url,
            gcs_uri=asset_doc.gcs_uri,
        )

    async def _create_media_template_response(
        self, item: MediaTemplateModel
    ) -> MediaTemplateResponse:
        """
        Helper function to convert a MediaItem into a GalleryItemResponse
        by generating presigned URLs in parallel for its GCS URIs.
        """
        all_gcs_uris = item.gcs_uris or []

        # 1. Create tasks for main media URLs
        main_url_tasks = [
            asyncio.to_thread(
                self.iam_signer_credentials.generate_presigned_url, uri
            )
            for uri in all_gcs_uris
            if uri
        ]
        # 2. Create tasks for thumbnail URLs
        thumbnail_tasks = [
            asyncio.to_thread(
                self.iam_signer_credentials.generate_presigned_url, uri
            )
            for uri in (item.thumbnail_uris or "")
            if uri
        ]
        # 3. Create tasks for source asset URLs
        source_asset_tasks = []
        if item.source_assets:
            source_asset_tasks = [
                self._enrich_source_asset_link(link)
                for link in item.source_assets
            ]

        # 5. Gather all results concurrently
        (
            presigned_urls,
            presigned_thumbnail_urls,
            enriched_source_assets_with_nones,
        ) = await asyncio.gather(
            asyncio.gather(*main_url_tasks),
            asyncio.gather(*thumbnail_tasks),
            asyncio.gather(*source_asset_tasks),
        )

        enriched_source_assets = [
            asset for asset in enriched_source_assets_with_nones if asset
        ]

        # Create the response DTO, copying all original data and adding the new URLs
        return MediaTemplateResponse(
            **item.model_dump(),
            presigned_urls=presigned_urls,
            presigned_thumbnail_urls=presigned_thumbnail_urls,
            enriched_source_assets=enriched_source_assets or None,
        )

    async def get_template_by_id(
        self, template_id: int
    ) -> Optional[MediaTemplateModel]:
        """Fetches a single template by its ID."""
        return await self.template_repo.get_by_id(template_id)

    async def find_all_templates(
        self, search_dto: TemplateSearchDto
    ) -> PaginationResponseDto[MediaTemplateResponse]:
        """Finds all templates with optional filtering and pagination."""
        # Run the synchronous database query in a separate thread
        media_templates_query = await self.template_repo.query(search_dto)
        media_templates = media_templates_query.data or []

        # Convert each MediaItem to a GalleryItemResponse in parallel
        response_tasks = [
            self._create_media_template_response(item)
            for item in media_templates
        ]
        enriched_items = await asyncio.gather(*response_tasks)

        return PaginationResponseDto[MediaTemplateResponse](
            count=media_templates_query.count,
            page=media_templates_query.page,
            page_size=media_templates_query.page_size,
            total_pages=media_templates_query.total_pages,
            data=enriched_items,
        )

    async def delete_template(self, template_id: int) -> bool:
        """Deletes a template by its ID. (Admin only)"""
        return await self.template_repo.delete(template_id)

    async def update_template(
        self, template_id: int, update_dto: UpdateTemplateDto
    ) -> Optional[MediaTemplateModel]:
        """Updates a template's information. (Admin only)"""
        # model_dump with exclude_unset=True creates a dict with only the provided fields
        update_data = update_dto.model_dump(exclude_unset=True)
        if not update_data:
            return await self.template_repo.get_by_id(
                template_id
            )  # Nothing to update

        return await self.template_repo.update(template_id, update_data)

    async def create_template_from_media_item(
        self,
        media_item_id: int,
        user: UserModel,
    ) -> Optional[MediaTemplateModel]:
        """
        Creates a new MediaTemplate by copying properties from an existing MediaItem
        and using Gemini to generate a creative name and description. (Admin only)
        """
        media_item = await self.media_item_repo.get_by_id(media_item_id)
        if not media_item:
            return None  # MediaItem not found

        # --- Use Gemini to generate a name and description ---
        prompt_for_gemini = f"""
          Based on the following creative prompt, generate a short, catchy 'Name', a one-sentence 'Description',
          generate a relevant industry, a fictional but plausible brand name, and a list of 5-7 relevant tags
          for a new template. The original prompt is: '{media_item.prompt}'.\n
        """
        target_type = (
            PromptTargetEnum.VIDEO
            if media_item.mime_type == MimeTypeEnum.VIDEO_MP4
            else PromptTargetEnum.IMAGE
        )

        # Run the synchronous Gemini call in a separate thread
        generated_text = await asyncio.to_thread(
            self.gemini_service.generate_structured_prompt,
            original_prompt="",
            target_type=target_type,
            prompt_template=prompt_for_gemini,
            response_mime_type=ResponseMimeTypeEnum.JSON,
            response_schema=CreatePromptTemplateDto,
        )
        metadata = CreatePromptTemplateDto.model_validate_json(generated_text)

        # --- Convert all source inputs into new, permanent System Assets ---
        new_source_asset_links: List[SourceAssetLink] = []
        public_workspace = await self.workspace_repo.get_public_workspace()
        if not public_workspace:
            # This should not happen if bootstrap script has run
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Public workspace not found. Cannot create template.",
            )

        # 1. Handle source assets from the 'user_assets' collection
        if media_item.source_assets:
            for link in media_item.source_assets:
                source_asset = await self.source_asset_repo.get_by_id(link.asset_id)
                if source_asset and source_asset.gcs_uri:
                    # Download the asset content
                    blob_name = source_asset.gcs_uri.replace(
                        f"gs://{self.gcs_service.bucket_name}/", "", 1
                    )
                    blob = self.gcs_service.bucket.blob(blob_name)
                    content_bytes = await asyncio.to_thread(
                        blob.download_as_bytes
                    )

                    # Create a mock UploadFile to use the existing service logic
                    upload_file = UploadFile(
                        filename=source_asset.original_filename,
                        file=io.BytesIO(content_bytes),
                        headers=Headers(
                            {"content-type": source_asset.mime_type}
                        ),
                    )

                    # Create a new system-level asset
                    new_asset_response = (
                        await self.source_asset_service.upload_asset(
                            user=user,
                            file=upload_file,
                            workspace_id=public_workspace.id,
                            scope=AssetScopeEnum.SYSTEM,
                            asset_type=source_asset.asset_type,
                            aspect_ratio=source_asset.aspect_ratio,
                        )
                    )
                    new_source_asset_links.append(
                        SourceAssetLink(
                            asset_id=new_asset_response.id, role=link.role
                        )
                    )

        # 2. Handle source media items from the 'media_library' collection
        if media_item.source_media_items:
            for link in media_item.source_media_items:
                source_media_item = await self.media_item_repo.get_by_id(link.media_item_id)
                if (
                    source_media_item
                    and source_media_item.gcs_uris
                    and 0 <= link.media_index < len(source_media_item.gcs_uris)
                ):
                    gcs_uri = source_media_item.gcs_uris[link.media_index]
                    blob_name = gcs_uri.replace(
                        f"gs://{self.gcs_service.bucket_name}/", "", 1
                    )
                    blob = self.gcs_service.bucket.blob(blob_name)
                    content_bytes = await asyncio.to_thread(
                        blob.download_as_bytes
                    )

                    upload_file = UploadFile(
                        filename=f"{source_media_item.id}_{link.media_index}.png",
                        file=io.BytesIO(content_bytes),
                        headers=Headers(
                            {"content-type": source_media_item.mime_type}
                        ),
                    )

                    new_asset_response = (
                        await self.source_asset_service.upload_asset(
                            user=user,
                            file=upload_file,
                            workspace_id=public_workspace.id,
                            scope=AssetScopeEnum.SYSTEM,
                            asset_type=AssetTypeEnum.GENERIC_IMAGE,
                            aspect_ratio=source_media_item.aspect_ratio,
                        )
                    )
                    new_source_asset_links.append(
                        SourceAssetLink(
                            asset_id=new_asset_response.id, role=link.role
                        )
                    )

        # Create the new template by mapping fields
        new_template = MediaTemplateModel(
            name=metadata.name,
            description=metadata.description,
            mime_type=media_item.mime_type,
            industry=metadata.industry,
            brand=metadata.brand,
            tags=metadata.tags or [],
            gcs_uris=media_item.gcs_uris,
            thumbnail_uris=media_item.thumbnail_uris,
            source_assets=new_source_asset_links or None,
            generation_parameters=GenerationParameters(
                prompt=media_item.original_prompt,
                model=media_item.model,
                aspect_ratio=media_item.aspect_ratio,
                style=media_item.style,
                lighting=media_item.lighting,
                color_and_tone=media_item.color_and_tone,
                composition=media_item.composition,
                negative_prompt=media_item.negative_prompt,
            ),
        )

        await self.template_repo.create(new_template)
        return new_template

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
import logging
from typing import Optional

from fastapi import Depends, HTTPException, status

from src.auth.iam_signer_credentials_service import IamSignerCredentials
from src.common.dto.pagination_response_dto import PaginationResponseDto
from src.common.schema.media_item_model import (
    AssetRoleEnum,
    JobStatusEnum,
    MediaItemModel,
    SourceAssetLink,
    SourceMediaItemLink,
)
from src.galleries.dto.gallery_response_dto import (
    MediaItemResponse,
    SourceAssetLinkResponse,
    SourceMediaItemLinkResponse,
)
from src.galleries.dto.gallery_search_dto import GallerySearchDto
from src.images.repository.media_item_repository import MediaRepository
from src.source_assets.repository.source_asset_repository import (
    SourceAssetRepository,
)
from src.users.user_model import UserModel, UserRoleEnum
from src.workspaces.repository.workspace_repository import WorkspaceRepository
from src.workspaces.schema.workspace_model import WorkspaceScopeEnum
from src.workspaces.workspace_auth_guard import workspace_auth_service

logger = logging.getLogger(__name__)


class GalleryService:
    """
    Provides business logic for querying media items and preparing them for the gallery.
    """

    def __init__(
        self,
        media_repo: MediaRepository = Depends(),
        source_asset_repo: SourceAssetRepository = Depends(),
        workspace_repo: WorkspaceRepository = Depends(),
        iam_signer_credentials: IamSignerCredentials = Depends(),
    ):
        """Initializes the service with its dependencies."""
        self.media_repo = media_repo
        self.source_asset_repo = source_asset_repo
        self.workspace_repo = workspace_repo
        self.iam_signer_credentials = iam_signer_credentials

    async def _enrich_source_asset_link(
        self, link: SourceAssetLink
    ) -> Optional[SourceAssetLinkResponse]:
        """
        Fetches the source asset document and generates a presigned URL for it.
        """
        asset_doc = await self.source_asset_repo.get_by_id(link.asset_id)
        
        if not asset_doc:
            return None

        tasks = [
            asyncio.to_thread(
                self.iam_signer_credentials.generate_presigned_url,
                asset_doc.gcs_uri,
            )
        ]

        # Check if the asset has a thumbnail and create a task for it.
        # This requires the SourceAsset model to have a `thumbnail_gcs_uri` field.
        if asset_doc.thumbnail_gcs_uri:
            tasks.append(
                asyncio.to_thread(
                    self.iam_signer_credentials.generate_presigned_url,
                    asset_doc.thumbnail_gcs_uri,
                )
            )

        results = await asyncio.gather(*tasks)
        presigned_url = results[0]
        presigned_thumbnail_url = results[1] if len(results) > 1 else None

        return SourceAssetLinkResponse(
            **link.model_dump(),
            presigned_url=presigned_url,
            presigned_thumbnail_url=presigned_thumbnail_url,
            gcs_uri=asset_doc.gcs_uri,
        )

    async def _enrich_source_media_item_link(
        self, link: SourceMediaItemLink
    ) -> Optional[SourceMediaItemLinkResponse]:
        """
        Fetches the parent MediaItem document and generates a presigned URL
        for the specific image that was used as input.
        """
        parent_item = await self.media_repo.get_by_id(link.media_item_id)
        if (
            not parent_item
            or not parent_item.gcs_uris
            or not (0 <= link.media_index < len(parent_item.gcs_uris))
        ):
            return None

        # Get the specific GCS URI of the parent image that was edited.
        parent_gcs_uri = parent_item.gcs_uris[link.media_index]

        # Prepare tasks for both the main media and its thumbnail
        tasks = [
            asyncio.to_thread(
                self.iam_signer_credentials.generate_presigned_url,
                parent_gcs_uri,
            )
        ]

        parent_thumbnail_gcs_uri = None
        if parent_item.thumbnail_uris and 0 <= link.media_index < len(
            parent_item.thumbnail_uris
        ):
            parent_thumbnail_gcs_uri = parent_item.thumbnail_uris[
                link.media_index
            ]
            tasks.append(
                asyncio.to_thread(
                    self.iam_signer_credentials.generate_presigned_url,
                    parent_thumbnail_gcs_uri,
                )
            )

        results = await asyncio.gather(*tasks)
        presigned_url = results[0]
        presigned_thumbnail_url = results[1] if len(results) > 1 else None

        return SourceMediaItemLinkResponse(
            **link.model_dump(),
            presigned_url=presigned_url,
            presigned_thumbnail_url=presigned_thumbnail_url,
            gcs_uri=parent_gcs_uri,
        )

    async def _create_gallery_response(
        self, item: MediaItemModel
    ) -> MediaItemResponse:
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

        # 4. Create tasks for generated input asset URLs
        source_media_item_tasks = []
        if item.source_media_items:
            source_media_item_tasks = [
                self._enrich_source_media_item_link(link)
                for link in item.source_media_items
            ]

        # 5. Gather all results concurrently
        (
            presigned_urls,
            presigned_thumbnail_urls,
            enriched_source_assets_with_nones,
            enriched_source_media_items_with_nones,
        ) = await asyncio.gather(
            asyncio.gather(*main_url_tasks),
            asyncio.gather(*thumbnail_tasks),
            asyncio.gather(*source_asset_tasks),
            asyncio.gather(*source_media_item_tasks),
        )

        enriched_source_assets = [
            asset for asset in enriched_source_assets_with_nones if asset
        ]
        enriched_source_media_items = [
            asset for asset in enriched_source_media_items_with_nones if asset
        ]

        # Create the response DTO, copying all original data and adding the new URLs
        return MediaItemResponse(
            **item.model_dump(exclude={"source_assets"}),
            presigned_urls=presigned_urls,
            presigned_thumbnail_urls=presigned_thumbnail_urls,
            enriched_source_assets=enriched_source_assets or None,
            enriched_source_media_items=enriched_source_media_items or None,
        )

    async def get_paginated_gallery(
        self, search_dto: GallerySearchDto, current_user: UserModel
    ) -> PaginationResponseDto[MediaItemResponse]:
        """
        Performs a paginated and filtered search for media items.
        Authorization is handled by a dependency in the controller.
        """
        is_admin = UserRoleEnum.ADMIN in current_user.roles
        # If the user is not an admin, force the search to only show completed items
        if not is_admin:
            search_dto.status = JobStatusEnum.COMPLETED

        # Run the database query directly (it is async)
        media_items_query = await self.media_repo.query(
            search_dto,
            workspace_id=search_dto.workspace_id,
        )
        media_items = media_items_query.data or []

        # Convert each MediaItem to a GalleryItemResponse in parallel
        response_tasks = [
            self._create_gallery_response(item) for item in media_items
        ]
        enriched_items = await asyncio.gather(*response_tasks)

        return PaginationResponseDto[MediaItemResponse](
            count=media_items_query.count,
            page=media_items_query.page,
            page_size=media_items_query.page_size,
            total_pages=media_items_query.total_pages,
            data=enriched_items,
        )

    async def get_media_by_id(
        self, item_id: str, current_user: UserModel
    ) -> Optional[MediaItemResponse]:
        """
        Retrieves a single media item, performs an authorization check,
        and enriches it with presigned URLs.
        """
        # Run the synchronous database query in a separate thread
        item = await self.media_repo.get_by_id(item_id)

        if not item:
            return None

        # Fetch the workspace for authorization check
        workspace = await self.workspace_repo.get_by_id(item.workspace_id)

        # This should ideally not happen if data is consistent, but it's a good safeguard.
        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent workspace for this item not found.",
            )

        # Use the centralized authorization logic
        await workspace_auth_service.authorize(
            workspace_id=item.workspace_id,
            user=current_user,
            workspace_repo=self.workspace_repo,
        )

        return await self._create_gallery_response(item)

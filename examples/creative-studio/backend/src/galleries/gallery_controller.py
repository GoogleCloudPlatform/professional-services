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

from fastapi import APIRouter, Depends, HTTPException, status

from src.auth.auth_guard import RoleChecker, get_current_user
from src.common.dto.pagination_response_dto import PaginationResponseDto
from src.galleries.dto.gallery_response_dto import MediaItemResponse
from src.galleries.dto.gallery_search_dto import GallerySearchDto
from src.galleries.gallery_service import GalleryService
from src.users.user_model import UserModel, UserRoleEnum
from src.workspaces.repository.workspace_repository import WorkspaceRepository
from src.workspaces.workspace_auth_guard import workspace_auth_service

router = APIRouter(
    prefix="/api/gallery",
    tags=["Creative Studio Media Gallery"],
    responses={404: {"description": "Not found"}},
    dependencies=[
        Depends(
            RoleChecker(
                allowed_roles=[
                    UserRoleEnum.ADMIN,
                    UserRoleEnum.USER,
                ]
            )
        )
    ],
)


@router.post(
    "/search",
    response_model=PaginationResponseDto[MediaItemResponse],
)
async def search_gallery_items(
    search_dto: GallerySearchDto,
    current_user: UserModel = Depends(get_current_user),
    service: GalleryService = Depends(),
    workspace_repo: WorkspaceRepository = Depends(),
):
    """
    Performs a paginated search for media items within a specific workspace.

    Provide filters in the request body to paginate through the gallery.
    to paginate through results.
    """
    # This dependency call acts as a gatekeeper. If the user is not authorized
    # for the workspace_id inside search_dto, it will raise an exception.
    await workspace_auth_service.authorize(
        workspace_id=search_dto.workspace_id,
        user=current_user,
        workspace_repo=workspace_repo,
    )

    return await service.get_paginated_gallery(
        search_dto=search_dto, current_user=current_user
    )


@router.get("/item/{item_id}", response_model=MediaItemResponse)
async def get_single_gallery_item(
    item_id: int,
    current_user: UserModel = Depends(get_current_user),
    service: GalleryService = Depends(),
):
    """
    Get a single media item by its ID.
    """
    # The service now requires the user to perform authorization checks.
    item = await service.get_media_by_id(
        item_id=item_id, current_user=current_user
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media item not found",
        )
    return item

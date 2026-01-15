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
from src.media_templates.dto.media_template_response_dto import (
    MediaTemplateResponse,
)
from src.media_templates.dto.template_search_dto import TemplateSearchDto
from src.media_templates.dto.update_template_dto import UpdateTemplateDto
from src.media_templates.media_templates_service import MediaTemplateService
from src.media_templates.schema.media_template_model import MediaTemplateModel
from src.users.user_model import UserModel, UserRoleEnum

# Define role checkers for convenience
admin_only = Depends(RoleChecker(allowed_roles=[UserRoleEnum.ADMIN]))
any_user = Depends(
    RoleChecker(allowed_roles=[UserRoleEnum.ADMIN, UserRoleEnum.USER])
)

router = APIRouter(
    prefix="/api/media-templates",
    tags=["Media Templates"],
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/from-media-item/{media_item_id}",
    response_model=MediaTemplateModel,
    summary="Create a New Template from a MediaItem",
    status_code=status.HTTP_201_CREATED,
    dependencies=[admin_only],
)
async def create_template(
    media_item_id: int,
    service: MediaTemplateService = Depends(),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Creates a new template by copying and enhancing data from an existing MediaItem.
    (Admin role required)
    """
    template = await service.create_template_from_media_item(
        media_item_id, current_user
    )
    if not template:
        raise HTTPException(
            status_code=404, detail="Source MediaItem not found."
        )
    return template


@router.get(
    "",
    response_model=PaginationResponseDto[MediaTemplateResponse],
    summary="Find All Templates",
    dependencies=[any_user],
)
async def find_templates(
    search_params: TemplateSearchDto = Depends(),
    service: MediaTemplateService = Depends(),
):
    """
    Finds and retrieves a paginated list of media templates based on search criteria.
    (Any authenticated user)
    """
    return await service.find_all_templates(search_params)


@router.get(
    "/{template_id}",
    response_model=MediaTemplateModel,
    summary="Get Template by ID",
    dependencies=[any_user],
)
async def get_template(
    template_id: int,
    service: MediaTemplateService = Depends(),
):
    """
    Retrieves a single media template by its unique ID.
    (Any authenticated user)
    """
    template = await service.get_template_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found.")
    return template


@router.put(
    "/{template_id}",
    response_model=MediaTemplateModel,
    summary="Update a Template",
    dependencies=[admin_only],
)
async def update_template(
    template_id: int,
    update_data: UpdateTemplateDto,
    service: MediaTemplateService = Depends(),
):
    """
    Updates the fields of an existing media template.
    (Admin role required)
    """
    updated_template = await service.update_template(template_id, update_data)
    if not updated_template:
        raise HTTPException(status_code=404, detail="Template not found.")
    return updated_template


@router.delete(
    "/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a Template",
    dependencies=[admin_only],
)
async def delete_template(
    template_id: int,
    service: MediaTemplateService = Depends(),
):
    """
    Permanently deletes a media template.
    (Admin role required)
    """
    if not await service.delete_template(template_id):
        raise HTTPException(status_code=404, detail="Template not found.")
    return

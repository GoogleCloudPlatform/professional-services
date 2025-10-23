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

from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)

from src.auth.auth_guard import RoleChecker, get_current_user
from src.brand_guidelines.brand_guideline_service import BrandGuidelineService
from src.brand_guidelines.dto.brand_guideline_response_dto import (
    BrandGuidelineResponseDto,
)
from src.users.user_model import UserModel, UserRoleEnum

MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

# Define role checkers for convenience
user_only = Depends(
    RoleChecker(allowed_roles=[UserRoleEnum.USER, UserRoleEnum.ADMIN])
)

router = APIRouter(
    prefix="/api/brand-guidelines",
    tags=["Brand Guidelines"],
    dependencies=[user_only],
)


@router.post(
    "/upload",
    response_model=BrandGuidelineResponseDto,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Create a Brand Guideline from a PDF",
)
async def create_brand_guideline(
    request: Request,
    name: str = Form(min_length=3, max_length=100),
    workspaceId: Optional[str] = Form(None),
    file: UploadFile = File(),
    service: BrandGuidelineService = Depends(),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Uploads a brand guideline PDF for a specific workspace.

    If a brand guideline already exists for the workspace, it will be
    deleted and replaced with the new one.

    This endpoint is asynchronous. It returns a placeholder immediately and
    starts the processing in the background.
    """
    if not file.content_type == "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a PDF.",
        )

    # Check file size before processing
    # We seek to the end to get the size, then back to the beginning.
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File is too large. Maximum size is {MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB.",
        )

    executor = request.app.state.process_pool

    # The service method now starts the background job.
    return await service.start_brand_guideline_processing_job(
        name=name,
        file=file,
        workspace_id=workspaceId,
        current_user=current_user,
        executor=executor,
    )


@router.get(
    "/workspace/{workspace_id}",
    response_model=BrandGuidelineResponseDto,
    summary="Get the Brand Guideline for a Workspace",
)
async def get_workspace_brand_guideline(
    workspace_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: BrandGuidelineService = Depends(),
):
    """
    Retrieves the unique brand guideline associated with a specific workspace.

    Returns a 404 error if no guideline has been created for the workspace yet.
    """
    guideline = await service.get_guideline_by_workspace_id(
        workspace_id, current_user
    )
    if not guideline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No brand guideline found for this workspace.",
        )
    return guideline


@router.get(
    "/{guideline_id}",
    response_model=BrandGuidelineResponseDto,
    summary="Get a Single Brand Guideline",
)
async def get_single_brand_guideline(
    guideline_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: BrandGuidelineService = Depends(),
):
    """
    Retrieves a single brand guideline by its unique ID.

    - Any authenticated user can view global guidelines.
    - Only members of a workspace can view its specific guidelines.
    """
    guideline = await service.get_guideline_by_id(guideline_id, current_user)
    if not guideline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand guideline not found.",
        )
    return guideline


@router.delete(
    "/{guideline_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a Brand Guideline",
)
async def delete_single_brand_guideline(
    guideline_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: BrandGuidelineService = Depends(),
):
    """
    Deletes a brand guideline and all of its associated assets (e.g., PDF chunks in GCS).

    - Only the workspace owner or a system admin can delete a workspace-specific guideline.
    - Only a system admin can delete a global guideline.
    """
    await service.delete_guideline(
        guideline_id=guideline_id, current_user=current_user
    )
    return None

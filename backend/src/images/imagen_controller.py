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

from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as Status

from src.auth.auth_guard import RoleChecker, get_current_user
from src.galleries.dto.gallery_response_dto import MediaItemResponse
from src.images.dto.create_imagen_dto import CreateImagenDto
from src.images.dto.edit_imagen_dto import EditImagenDto
from src.images.dto.upscale_imagen_dto import UpscaleImagenDto
from src.images.dto.vto_dto import VtoDto
from src.images.imagen_service import ImagenService
from src.images.schema.imagen_result_model import ImageGenerationResult
from src.users.user_model import UserModel, UserRoleEnum
from src.workspaces.workspace_auth_guard import workspace_auth_service

# Define role checkers for convenience
user_only = Depends(
    RoleChecker(allowed_roles=[UserRoleEnum.USER, UserRoleEnum.ADMIN])
)

router = APIRouter(
    prefix="/api/images",
    tags=["Google Imagen APIs"],
    responses={404: {"description": "Not found"}},
    dependencies=[user_only],
)


@router.post("/generate-images")
async def generate_images(
    image_request: CreateImagenDto,
    service: ImagenService = Depends(),
    current_user: UserModel = Depends(get_current_user),
) -> MediaItemResponse | None:
    try:
        # Use our centralized dependency to authorize the user for the workspace
        # before proceeding with the expensive generation job.
        workspace_auth_service.authorize(
            workspace_id=image_request.workspace_id, user=current_user
        )

        return await service.generate_images(
            request_dto=image_request, user=current_user
        )
    except HTTPException as http_exception:
        raise http_exception
    except ValueError as value_error:
        raise HTTPException(
            status_code=Status.HTTP_400_BAD_REQUEST,
            detail=str(value_error),
        )
    except Exception as e:
        raise HTTPException(
            status_code=Status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/generate-images-for-vto")
async def generate_images_vto(
    image_request: VtoDto,
    service: ImagenService = Depends(),
    current_user: UserModel = Depends(get_current_user),
) -> MediaItemResponse | None:

    try:
        return await service.generate_image_for_vto(
            request_dto=image_request, user=current_user
        )
    except HTTPException as http_exception:
        raise http_exception
    except ValueError as value_error:
        raise HTTPException(
            status_code=Status.HTTP_400_BAD_REQUEST,
            detail=str(value_error),
        )
    except Exception as e:
        raise HTTPException(
            status_code=Status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/recontextualize-product-in-scene")
def recontextualize_product_in_scene(
    image_uris_list: list[str],
    prompt: str,
    sample_count: int,
    service: ImagenService = Depends(),
) -> list[str]:
    try:
        return service.recontextualize_product_in_scene(
            image_uris_list, prompt, sample_count
        )
    except Exception as e:
        raise HTTPException(
            status_code=Status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post("/edit-image")
def edit_image(
    image_request: EditImagenDto, service: ImagenService = Depends()
) -> list[ImageGenerationResult]:
    try:
        return service.edit_image(image_request)
    except Exception as e:
        raise HTTPException(
            status_code=Status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post("/upscale-image")
async def upscale_image(
    image_request: UpscaleImagenDto,
    service: ImagenService = Depends(),
) -> ImageGenerationResult | None:
    try:
        return await service.upscale_image(request_dto=image_request)
    except HTTPException as http_exception:
        raise http_exception
    except ValueError as value_error:
        raise HTTPException(
            status_code=Status.HTTP_400_BAD_REQUEST,
            detail=str(value_error),
        )
    except Exception as e:
        raise HTTPException(
            status_code=Status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )

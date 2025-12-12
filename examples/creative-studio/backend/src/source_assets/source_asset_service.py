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
import logging
import os
import shutil
import uuid
from typing import List, Optional

from fastapi import Depends, HTTPException, UploadFile, status
from PIL import Image as PILImage

from src.auth.iam_signer_credentials_service import IamSignerCredentials
from src.common.base_dto import (
    AspectRatioEnum,
    GenerationModelEnum,
    MimeTypeEnum,
)
from src.common.dto.pagination_response_dto import PaginationResponseDto
from src.common.media_utils import generate_thumbnail, get_video_dimensions
from src.common.storage_service import GcsService
from src.images.dto.upscale_imagen_dto import UpscaleImagenDto
from src.images.imagen_service import ImagenService
from src.source_assets.dto.source_asset_response_dto import (
    SourceAssetResponseDto,
)
from src.source_assets.dto.source_asset_search_dto import SourceAssetSearchDto
from src.source_assets.dto.vto_assets_response_dto import VtoAssetsResponseDto
from src.source_assets.repository.source_asset_repository import (
    SourceAssetRepository,
)
from src.source_assets.schema.source_asset_model import (
    AssetScopeEnum,
    AssetTypeEnum,
    SourceAssetModel,
)
from src.users.user_model import UserModel, UserRoleEnum

logger = logging.getLogger(__name__)


class SourceAssetService:
    """Provides business logic for managing user-uploaded assets."""

    def __init__(
        self,
        repo: SourceAssetRepository = Depends(),
        gcs_service: GcsService = Depends(),
        iam_signer: IamSignerCredentials = Depends(),
        imagen_service: ImagenService = Depends(),
    ):
        self.repo = repo
        self.gcs_service = gcs_service
        self.iam_signer = iam_signer
        self.imagen_service = imagen_service  # Service to perform the upscale

    async def _get_and_validate_aspect_ratio(
        self,
        contents: bytes,
        is_video: bool,
        temp_video_path: Optional[str] = None,
        provided_aspect_ratio: Optional[str] = None,
    ) -> AspectRatioEnum:
        """
        Validates a provided aspect ratio or deduces it from the file.
        Rejects files that do not match a supported AspectRatioEnum value.
        """
        # For videos, we ALWAYS deduce the aspect ratio and ignore any provided one.
        if is_video:
            if not temp_video_path:
                raise Exception(
                    "Temp video path is required to deduce video aspect ratio."
                )
            width, height = await asyncio.to_thread(
                get_video_dimensions, temp_video_path
            )

        # For images, we first check if a valid ratio was provided.
        elif provided_aspect_ratio:
            try:
                # If the provided string is a valid enum member, we're done.
                return AspectRatioEnum(provided_aspect_ratio)
            except ValueError:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"Invalid aspect ratio '{provided_aspect_ratio}' provided.",
                )

        # For images without a provided ratio, we deduce it.
        else:
            pil_image = PILImage.open(io.BytesIO(contents))
            width, height = pil_image.size

        if height == 0:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "Media has zero height."
            )

        actual_ratio = width / height

        # Find the closest supported enum by comparing float values
        supported_ratios = {
            e: float(e.value.split(":")[0]) / float(e.value.split(":")[1])
            for e in AspectRatioEnum
        }

        closest_enum = min(
            supported_ratios.keys(),
            key=lambda e: abs(supported_ratios[e] - actual_ratio),
        )

        # Check if the closest match is within a small tolerance (e.g., 2%)
        if abs(supported_ratios[closest_enum] - actual_ratio) > 0.02:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Uploaded file has an unsupported aspect ratio (approx. {width}x{height}). Please use a supported format.",
            )

        logger.info(f"Deduced aspect ratio as {closest_enum.value}")
        return closest_enum

    async def _create_asset_response(
        self, asset: SourceAssetModel
    ) -> SourceAssetResponseDto:
        """Generates presigned URLs for the asset and its thumbnail."""
        tasks = [
            asyncio.to_thread(
                self.iam_signer.generate_presigned_url, asset.gcs_uri
            )
        ]

        if asset.thumbnail_gcs_uri:
            tasks.append(
                asyncio.to_thread(
                    self.iam_signer.generate_presigned_url,
                    asset.thumbnail_gcs_uri,
                )
            )

        results = await asyncio.gather(*tasks)
        presigned_url = results[0]
        presigned_thumbnail_url = results[1] if len(results) > 1 else ""

        return SourceAssetResponseDto(
            **asset.model_dump(),
            presigned_url=presigned_url,
            presigned_thumbnail_url=presigned_thumbnail_url,
        )

    async def upload_asset(
        self,
        user: UserModel,
        file: UploadFile,
        workspace_id: int,
        scope: Optional[AssetScopeEnum] = None,
        asset_type: Optional[AssetTypeEnum] = None,
        aspect_ratio: Optional[AspectRatioEnum] = None,
    ) -> SourceAssetResponseDto:
        """
        Handles uploading, de-duplicating, upscaling, and saving a new user asset.
        """
        contents = await file.read()
        if not contents:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "Cannot upload an empty file."
            )

        file_hash = hashlib.sha256(contents).hexdigest()

        # 1. Check for duplicates for this user
        existing_asset = await self.repo.find_by_hash(user.id, file_hash)
        if existing_asset:
            logger.info(
                f"Duplicate asset found for user {user.email} with hash {file_hash[:8]}. Returning existing."
            )
            return await self._create_asset_response(existing_asset)

        # 2. Handle file processing based on type (image vs. video)
        is_video: bool = bool(
            file.content_type and "video" in file.content_type
        )
        final_gcs_uri: Optional[str] = None
        thumbnail_gcs_uri: Optional[str] = None
        temp_dir = f"temp/source_assets/{uuid.uuid4()}"
        final_aspect_ratio: AspectRatioEnum

        try:
            local_path = None
            if is_video:
                # --- Video Upload Logic ---
                os.makedirs(temp_dir, exist_ok=True)
                local_path = os.path.join(temp_dir, file.filename or "asset")
                with open(local_path, "wb") as buffer:
                    buffer.write(contents)

                # Check for valid aspect ratio early in the process
                final_aspect_ratio = await self._get_and_validate_aspect_ratio(
                    contents=contents,
                    is_video=is_video,
                    temp_video_path=local_path,
                    provided_aspect_ratio=aspect_ratio,
                )

                # Upload the original video
                final_gcs_uri = self.gcs_service.upload_file_to_gcs(
                    local_path=local_path,
                    destination_blob_name=f"source_assets/{user.id}/{file_hash}/{file.filename}",
                    mime_type="video/mp4",
                )

                # Generate and upload thumbnail
                thumbnail_path = generate_thumbnail(local_path)
                if thumbnail_path:
                    thumbnail_gcs_uri = self.gcs_service.upload_file_to_gcs(
                        local_path=thumbnail_path,
                        destination_blob_name=f"source_assets/{user.id}/{file_hash}/thumbnail.png",
                        mime_type="image/png",
                    )
            else:
                # --- Image Upload & Upscale Logic ---
                # Check for valid aspect ratio early in the process
                final_aspect_ratio = await self._get_and_validate_aspect_ratio(
                    contents=contents,
                    is_video=is_video,
                    temp_video_path=local_path,
                    provided_aspect_ratio=aspect_ratio,
                )

                # Convert image to PNG for standardization before storing.
                pil_image = PILImage.open(io.BytesIO(contents))
                png_contents: bytes

                if pil_image.format != "PNG":
                    with io.BytesIO() as output:
                        # Convert to RGB to avoid issues with palettes (e.g., in GIFs)
                        if pil_image.mode != "RGB":
                            pil_image = pil_image.convert("RGB")
                        pil_image.save(output, format="PNG")
                        png_contents = output.getvalue()
                else:
                    png_contents = contents

                # If the image is already high-resolution, we skip upscaling.
                if pil_image.width >= 2048 or pil_image.height >= 2048:
                    final_gcs_uri = self.gcs_service.store_to_gcs(
                        folder=f"source_assets/{user.id}/originals",
                        file_name=f"{file_hash}.png",
                        mime_type=MimeTypeEnum.IMAGE_PNG,
                        contents=png_contents,
                        decode=False,
                    )
                else:
                    # --- Upscale Logic for lower-resolution images ---
                    original_gcs_uri = self.gcs_service.store_to_gcs(
                        folder=f"source_assets/{user.id}/originals",
                        file_name=f"{file_hash}.png",
                        mime_type=MimeTypeEnum.IMAGE_PNG,
                        contents=png_contents,
                        decode=False,
                    )
                    if not original_gcs_uri:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Could not store the original asset.",
                        )

                    try:
                        # Determine the best upscale factor. If a 2x upscale is
                        # still not high-res, use 4x for the best quality.
                        upscale_factor = (
                            "x4"
                            if (pil_image.width * 2 < 2048)
                            and (pil_image.height * 2 < 2048)
                            else "x2"
                        )

                        # Upscale the standardized PNG image.
                        upscale_dto = UpscaleImagenDto(
                            user_image=original_gcs_uri,
                            upscale_factor=upscale_factor,
                            mime_type=MimeTypeEnum.IMAGE_PNG,
                            generation_model=GenerationModelEnum.IMAGEN_3_002,
                        )
                        upscaled_result = (
                            await self.imagen_service.upscale_image(upscale_dto)
                        )

                        if (
                            not upscaled_result
                            or not upscaled_result.image.gcs_uri
                        ):
                            logger.warning(
                                "Upscaling failed, using original image."
                            )
                            final_gcs_uri = original_gcs_uri
                        else:
                            final_gcs_uri = upscaled_result.image.gcs_uri
                            logger.info(
                                f"Upscaling complete. Final asset at {final_gcs_uri}"
                            )
                    except Exception as e:
                        logger.error(
                            f"Failed to upscale asset for user {user.email}: {e}",
                            exc_info=True,
                        )
                        # Fallback: if upscale fails, use the original URI
                        final_gcs_uri = original_gcs_uri

            if not final_gcs_uri:
                raise Exception("Failed to process and upload asset.")
        except Exception as e:
            logger.error(f"Asset processing failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process asset: {e}",
            )
        finally:
            # Clean up the temporary directory if it was created
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)

        # 4. Create and save the new UserAsset document
        mime_type: MimeTypeEnum = (
            MimeTypeEnum.VIDEO_MP4
            if file.content_type == MimeTypeEnum.VIDEO_MP4
            else MimeTypeEnum.IMAGE_PNG
        )

        is_admin = UserRoleEnum.ADMIN in user.roles
        final_scope = AssetScopeEnum.PRIVATE
        final_asset_type = asset_type or AssetTypeEnum.GENERIC_IMAGE

        if is_admin:
            # Admins can set scope and type freely.
            final_scope = scope or AssetScopeEnum.PRIVATE
        else:
            # Non-admins cannot set system-level scope.
            if scope and scope != AssetScopeEnum.PRIVATE:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only administrators can set a non-private scope.",
                )

        new_asset = SourceAssetModel(
            workspace_id=workspace_id,
            user_id=user.id,
            aspect_ratio=final_aspect_ratio,
            gcs_uri=final_gcs_uri,
            thumbnail_gcs_uri=thumbnail_gcs_uri,
            original_filename=file.filename or "untitled",
            mime_type=mime_type,
            file_hash=file_hash,
            scope=final_scope,
            asset_type=final_asset_type,
        )
        new_asset = await self.repo.create(new_asset)

        return await self._create_asset_response(new_asset)

    async def convert_to_png(self, file: UploadFile) -> bytes:
        """
        Converts an uploaded image file to PNG format in memory.
        """
        try:
            contents = await file.read()
            if not contents:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST, "Cannot convert an empty file."
                )

            pil_image = PILImage.open(io.BytesIO(contents))

            # Convert to a standard color mode to handle various formats
            # (e.g., GIFs with palettes, CMYK) gracefully, preserving transparency.
            if pil_image.mode not in ["RGB", "RGBA"]:
                pil_image = pil_image.convert(
                    "RGBA" if "A" in pil_image.getbands() else "RGB"
                )

            # Save the converted image to an in-memory buffer
            with io.BytesIO() as output:
                pil_image.save(output, format="PNG")
                return output.getvalue()
        except Exception as e:
            logger.error(f"Failed to convert image to PNG: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process image: {e}",
            )

    async def delete_asset(self, asset_id: int) -> bool:
        """
        Deletes an asset from Firestore and its corresponding file from GCS.
        This is an admin-only operation.

        Returns:
            bool: True if deletion was successful, False if the asset was not found.
        """
        # 1. Get the asset document from Firestore
        asset_to_delete = await self.repo.get_by_id(asset_id)
        if not asset_to_delete:
            logger.warning(
                f"Attempted to delete non-existent asset with ID: {asset_id}"
            )
            return False

        # 2. Delete the file from GCS. We wrap this in a try/except block
        # to ensure that even if the GCS file is already gone, we still
        # attempt to delete the database record.
        try:
            logger.info(
                f"Deleting asset file from GCS: {asset_to_delete.gcs_uri}"
            )
            self.gcs_service.delete_blob_from_uri(asset_to_delete.gcs_uri)
        except Exception as e:
            logger.error(
                f"Could not delete asset from GCS at {asset_to_delete.gcs_uri}, but proceeding to delete from database. Error: {e}",
                exc_info=True,
            )

        # 3. Delete the document from Firestore
        logger.info(
            f"Deleting asset document from Firestore with ID: {asset_id}"
        )
        return await self.repo.delete(asset_id)

    async def list_assets_for_user(
        self,
        search_dto: SourceAssetSearchDto,
        target_user_id: Optional[int] = None,
    ) -> PaginationResponseDto[SourceAssetResponseDto]:
        """
        Performs a paginated search, scoped to a target_user_id if provided.
        """
        assets_query_result = await self.repo.query(search_dto, target_user_id)
        assets = assets_query_result.data or []

        response_tasks = [
            self._create_asset_response(asset) for asset in assets
        ]
        enriched_assets = await asyncio.gather(*response_tasks)

        return PaginationResponseDto[SourceAssetResponseDto](
            count=assets_query_result.count,
            page=assets_query_result.page,
            page_size=assets_query_result.page_size,
            total_pages=assets_query_result.total_pages,
            data=enriched_assets,
        )

    async def get_all_vto_assets(self, user: UserModel) -> VtoAssetsResponseDto:
        """
        Fetches all system-level VTO assets and categorizes them.

        This is used to populate the VTO selection UI for users or admins.
        """
        vto_asset_types: List[AssetTypeEnum] = [
            AssetTypeEnum.VTO_PERSON_MALE,
            AssetTypeEnum.VTO_PERSON_FEMALE,
            AssetTypeEnum.VTO_TOP,
            AssetTypeEnum.VTO_BOTTOM,
            AssetTypeEnum.VTO_DRESS,
            AssetTypeEnum.VTO_SHOE,
        ]

        # Query for both system assets and the user's private assets in a single DB call.
        all_assets = await self.repo.find_system_and_private_assets_by_types(
            user.id, vto_asset_types
        )

        # Create presigned URLs for all assets in parallel
        response_tasks = [
            self._create_asset_response(asset) for asset in all_assets
        ]
        enriched_assets = await asyncio.gather(*response_tasks)

        # Categorize the assets into the response DTO
        categorized_assets = VtoAssetsResponseDto()
        asset_map = {
            AssetTypeEnum.VTO_PERSON_MALE: categorized_assets.male_models,
            AssetTypeEnum.VTO_PERSON_FEMALE: categorized_assets.female_models,
            AssetTypeEnum.VTO_TOP: categorized_assets.tops,
            AssetTypeEnum.VTO_BOTTOM: categorized_assets.bottoms,
            AssetTypeEnum.VTO_DRESS: categorized_assets.dresses,
            AssetTypeEnum.VTO_SHOE: categorized_assets.shoes,
        }

        for asset in enriched_assets:
            if asset.asset_type in asset_map:
                asset_map[asset.asset_type].append(asset)

        return categorized_assets

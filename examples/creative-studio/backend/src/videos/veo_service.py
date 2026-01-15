# Copyright 2024 Google LLC
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
import os
import shutil
import subprocess
import sys
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional

from fastapi import Depends
from google.cloud.logging import Client as LoggerClient
from google.cloud.logging.handlers import CloudLoggingHandler
from google.genai import types

from src.auth.iam_signer_credentials_service import IamSignerCredentials
from src.common.base_dto import (
    GenerationModelEnum,
    MimeTypeEnum,
    ReferenceImageTypeEnum,
)
from src.common.media_utils import concatenate_videos, generate_thumbnail
from src.common.schema.genai_model_setup import GenAIModelSetup
from src.common.schema.media_item_model import (
    AssetRoleEnum,
    JobStatusEnum,
    MediaItemModel,
    SourceAssetLink,
    SourceMediaItemLink,
)
from src.common.storage_service import GcsService
from src.config.config_service import config_service
from src.galleries.dto.gallery_response_dto import MediaItemResponse
from src.images.repository.media_item_repository import MediaRepository
from src.multimodal.gemini_service import GeminiService, PromptTargetEnum
from src.source_assets.repository.source_asset_repository import (
    SourceAssetRepository,
)
from src.users.user_model import UserModel
from src.videos.dto.concatenate_videos_dto import ConcatenateVideosDto
from src.videos.dto.create_veo_dto import CreateVeoDto

logger = logging.getLogger(__name__)


# --- STANDALONE WORKER FUNCTION ---
# This function will run in the background process. It is defined outside the class.
def _process_video_in_background(
    media_item_id: int,
    request_dto: CreateVeoDto,
    user_email: str,
):  # type: ignore
    """
    This is the long-running worker task. It creates its own service instances
    because it runs in a completely separate process.
    The long-running process that generates video, thumbnails, and updates the
    database record upon completion or failure.
    """
    import asyncio
    import os
    import sys
    from google.cloud.logging import Client as LoggerClient
    from google.cloud.logging.handlers import CloudLoggingHandler
    from src.database import WorkerDatabase

    # In a new process, the logging configuration is reset. We must re-configure it
    # to see logs with a level of INFO or lower.
    # --- HYBRID LOGGING SETUP FOR THE WORKER PROCESS ---
    worker_logger = logging.getLogger(f"video_worker.{media_item_id}")
    worker_logger.setLevel(logging.INFO)

    try:
        # Clear any handlers that might be inherited from the parent process
        if worker_logger.hasHandlers():
            worker_logger.handlers.clear()

        if os.getenv("ENVIRONMENT") == "production":
            # In PRODUCTION, use the CloudLoggingHandler for structured JSON logs.
            log_client = LoggerClient()
            handler = CloudLoggingHandler(
                log_client, name=f"video_worker.{media_item_id}"
            )
            worker_logger.addHandler(handler)
        else:
            # In DEVELOPMENT, use a simple stream handler for readable console output.
            handler = logging.StreamHandler(sys.stdout)
            formatter = logging.Formatter(
                "%(asctime)s - [VIDEO_WORKER] - %(levelname)s - %(message)s"
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
                    media_repo = MediaRepository(db)
                    source_asset_repo = SourceAssetRepository(db)
                    gemini_service = GeminiService(brand_guideline_repo=None) # BrandGuidelineRepo not strictly needed for prompt enhancement if not using guidelines, but let's check if GeminiService needs it. 
                    # Actually GeminiService init: def __init__(self, brand_guideline_repo: BrandGuidelineRepository = Depends()):
                    # If we pass None, it might fail if it tries to use it.
                    # Let's instantiate BrandGuidelineRepository too if needed.
                    # Checking GeminiService usage: enhance_prompt_from_dto.
                    # It might use brand guidelines.
                    # Let's instantiate it to be safe.
                    from src.brand_guidelines.repository.brand_guideline_repository import BrandGuidelineRepository
                    brand_guideline_repo = BrandGuidelineRepository(db)
                    gemini_service = GeminiService(brand_guideline_repo=brand_guideline_repo)
                    
                    gcs_service = GcsService()
                    
                    try:
                        client = GenAIModelSetup.init()
                        cfg = config_service
                        gcs_output_directory = f"gs://{cfg.GENMEDIA_BUCKET}"

                        rewritten_prompt = await gemini_service.enhance_prompt_from_dto(
                            dto=request_dto, target_type=PromptTargetEnum.VIDEO
                        )
                        original_prompt = request_dto.prompt
                        request_dto.prompt = rewritten_prompt

                        # --- Handle Source Assets for API Call ---
                        start_image_for_api: Optional[types.Image] = None
                        end_image_for_api: Optional[types.Image] = None
                        reference_images_for_api: List[
                            types.VideoGenerationReferenceImage
                        ] = []  # 1. Create a list for reference images

                        # --- Handle Video Extension ---
                        source_video_for_api: Optional[types.Video] = None

                        # --- Handle Generated Inputs for Source Assets (start/end frames, source video, and references) ---
                        if request_dto.source_video_asset_id:
                            video_asset = await source_asset_repo.get_by_id(
                                request_dto.source_video_asset_id
                            )
                            if video_asset:
                                source_video_for_api = types.Video(
                                    uri=video_asset.gcs_uri, mime_type=video_asset.mime_type
                                )
                            else:
                                worker_logger.warning(
                                    f"Could not find source video asset: {request_dto.source_video_asset_id}"
                                )
                        if request_dto.start_image_asset_id:
                            start_asset = await source_asset_repo.get_by_id(
                                request_dto.start_image_asset_id
                            )
                            if start_asset:
                                start_image_for_api = types.Image(
                                    gcs_uri=start_asset.gcs_uri,
                                    mime_type=start_asset.mime_type,
                                )

                        if request_dto.end_image_asset_id:
                            end_asset = await source_asset_repo.get_by_id(
                                request_dto.end_image_asset_id
                            )
                            if end_asset:
                                end_image_for_api = types.Image(
                                    gcs_uri=end_asset.gcs_uri, mime_type=end_asset.mime_type
                                )

                        if request_dto.reference_images:
                            worker_logger.info(
                                f"Loading {len(request_dto.reference_images)} reference images."
                            )
                            for ref_dto in request_dto.reference_images:
                                asset = await source_asset_repo.get_by_id(ref_dto.asset_id)
                                if asset and asset.gcs_uri:
                                    image = types.Image(
                                        gcs_uri=asset.gcs_uri, mime_type=asset.mime_type
                                    )

                                    # Map our DTO enum to the Google SDK's enum
                                    sdk_ref_type = None
                                    if (
                                        ref_dto.reference_type
                                        == ReferenceImageTypeEnum.ASSET
                                    ):
                                        sdk_ref_type = (
                                            types.VideoGenerationReferenceType.ASSET
                                        )
                                    elif (
                                        ref_dto.reference_type
                                        == ReferenceImageTypeEnum.STYLE
                                    ):
                                        sdk_ref_type = (
                                            types.VideoGenerationReferenceType.STYLE
                                        )

                                    if sdk_ref_type:
                                        reference_images_for_api.append(
                                            types.VideoGenerationReferenceImage(
                                                image=image, reference_type=sdk_ref_type
                                            )
                                        )

                        # --- Handle Generated Inputs for Media Items (start/end frames, source video, and references) ---
                        if request_dto.source_media_items:
                            for gen_input in request_dto.source_media_items:
                                parent_item = await media_repo.get_by_id(gen_input.media_item_id)
                                if (
                                    parent_item
                                    and parent_item.gcs_uris
                                    and 0
                                    <= gen_input.media_index
                                    < len(parent_item.gcs_uris)
                                ):
                                    gcs_uri = parent_item.gcs_uris[gen_input.media_index]
                                    image_for_api = types.Image(
                                        gcs_uri=gcs_uri, mime_type=parent_item.mime_type
                                    )

                                    if gen_input.role == AssetRoleEnum.START_FRAME:
                                        start_image_for_api = image_for_api
                                    elif gen_input.role == AssetRoleEnum.END_FRAME:
                                        end_image_for_api = image_for_api
                                    elif (
                                        gen_input.role
                                        == AssetRoleEnum.VIDEO_EXTENSION_SOURCE
                                    ):
                                        source_video_for_api = types.Video(
                                            uri=gcs_uri, mime_type=parent_item.mime_type
                                        )
                                    elif (
                                        gen_input.role
                                        == AssetRoleEnum.IMAGE_REFERENCE_ASSET
                                    ):
                                        image_for_api = types.Image(
                                            gcs_uri=gcs_uri, mime_type=parent_item.mime_type
                                        )
                                        reference_images_for_api.append(
                                            types.VideoGenerationReferenceImage(
                                                image=image_for_api,
                                                reference_type=types.VideoGenerationReferenceType.ASSET,
                                            )
                                        )
                                    elif (
                                        gen_input.role
                                        == AssetRoleEnum.IMAGE_REFERENCE_STYLE
                                    ):
                                        image_for_api = types.Image(
                                            gcs_uri=gcs_uri, mime_type=parent_item.mime_type
                                        )
                                        reference_images_for_api.append(
                                            types.VideoGenerationReferenceImage(
                                                image=image_for_api,
                                                reference_type=types.VideoGenerationReferenceType.STYLE,
                                            )
                                        )
                                else:
                                    worker_logger.warning(
                                        f"Could not find or use generated_input: {gen_input.media_item_id} at index {gen_input.media_index}"
                                    )

                        # Validation to prevent conflicting inputs
                        if reference_images_for_api and (
                            start_image_for_api or end_image_for_api or source_video_for_api
                        ):
                            raise ValueError(
                                "Reference images cannot be used at the same time as a start/end image or a source video."
                            )

                        all_generated_videos: List[types.GeneratedVideo] = []

                        start_time = time.monotonic()

                        # Run sync API call in thread
                        operation: types.GenerateVideosOperation = await asyncio.to_thread(
                            client.models.generate_videos,
                            model=request_dto.generation_model,
                            prompt=request_dto.prompt,
                            image=start_image_for_api,
                            video=source_video_for_api,
                            config=types.GenerateVideosConfig(
                                number_of_videos=request_dto.number_of_media,
                                output_gcs_uri=gcs_output_directory,
                                aspect_ratio=request_dto.aspect_ratio,
                                negative_prompt=request_dto.negative_prompt,
                                generate_audio=request_dto.generate_audio,
                                # TODO: Pass from dto the secs if extending video (4, 5, 6, 7)
                                duration_seconds=(
                                    request_dto.duration_seconds
                                    if not source_video_for_api
                                    else 7
                                ),
                                last_frame=end_image_for_api,
                                reference_images=(
                                    reference_images_for_api
                                    if reference_images_for_api
                                    else None
                                ),
                            ),
                        )

                        # Poll the operation status until the video is ready
                        while not operation.done:
                            worker_logger.info(
                                "Waiting for video generation to complete, polling video generation status...",
                                extra={
                                    "json_fields": {
                                        "media_id": media_item_id,
                                        "operation_name": operation.name,
                                    }
                                },
                            )
                            await asyncio.sleep(10)
                            operation = await asyncio.to_thread(client.operations.get, operation)

                        if operation.error:
                            raise Exception(operation.error)

                        if (
                            not operation
                            or not operation.response
                            or not operation.response.generated_videos
                        ):
                            return None

                        # Download the generated video and create thumbnail
                        thumbnail_path = ""

                        final_source_media_items = request_dto.source_media_items
                        permanent_thumbnail_gcs_uris = []

                        for generated_video in operation.response.generated_videos:
                            if generated_video.video and generated_video.video.uri:
                                output_path = f"{generated_video.video.uri.replace(f'gs://{cfg.GENMEDIA_BUCKET}/', '')}"

                                # Step 1: Download the Video from GCS
                                local_output_path = f"thumbnails/{output_path}"
                                downloaded_video_path = await asyncio.to_thread(
                                    gcs_service.download_from_gcs,
                                    gcs_uri_path=output_path,
                                    destination_file_path=local_output_path,
                                )

                                # Step 2: Generate Thumbnail from the first video frame
                                thumbnail_path = await asyncio.to_thread(
                                    generate_thumbnail,
                                    downloaded_video_path or ""
                                )

                                # Step 3: Save the Thumbnail in GCS
                                if thumbnail_path:
                                    # Get the parent directory of the thumbnail to clean it up later.
                                    temp_dir = os.path.dirname(thumbnail_path)
                                    try:
                                        thumbnail_gcs_uri = await asyncio.to_thread(
                                            gcs_service.upload_file_to_gcs,
                                            local_path=thumbnail_path,
                                            destination_blob_name=thumbnail_path.replace(
                                                "thumbnails/", ""
                                            ),
                                            mime_type="image/png",
                                        ) or ""
                                        
                                        permanent_thumbnail_gcs_uris.append(
                                            thumbnail_gcs_uri
                                        )
                                        # TODO: Delete the folder created under thumbnails/
                                    except Exception as e:
                                        # It's good practice to log or handle potential upload errors.
                                        print(
                                            f"Failed to upload {thumbnail_path}. Error: {e}"
                                        )
                                    finally:
                                        # This block executes whether the try block succeeded or failed.
                                        # We use shutil.rmtree to recursively delete the temporary directory.
                                        if os.path.exists(temp_dir):
                                            shutil.rmtree(temp_dir)

                        all_generated_videos.extend(
                            operation.response.generated_videos or []
                        )

                        end_time = time.monotonic()
                        generation_time = end_time - start_time

                        valid_generated_videos = [
                            img
                            for img in all_generated_videos
                            if img.video and img.video.uri
                        ]
                        permanent_gcs_uris = [
                            img.video.uri
                            for img in valid_generated_videos
                            if img.video and img.video.uri
                        ]

                        # --- WHEN COMPLETE, UPDATE THE DOCUMENT IN FIRESTORE ---
                        update_data = {
                            "status": JobStatusEnum.COMPLETED,
                            "prompt": rewritten_prompt,
                            "gcs_uris": permanent_gcs_uris,  # The final GCS URLs
                            "thumbnail_uris": permanent_thumbnail_gcs_uris,
                            "generation_time": generation_time,
                            "num_media": len(permanent_gcs_uris),
                            "source_media_items": (
                                [item.model_dump() for item in final_source_media_items]
                                if final_source_media_items
                                else None
                            ),
                        }
                        await media_repo.update(media_item_id, update_data)
                        worker_logger.info(
                            "Successfully processed video job.",
                            extra={
                                "json_fields": {
                                    "media_id": media_item_id,
                                    "generation_time_seconds": generation_time,
                                    "videos_generated": len(permanent_gcs_uris),
                                }
                            },
                        )

                    except Exception as e:
                        worker_logger.error(
                            "Video generation task failed.",
                            extra={
                                "json_fields": {"media_id": media_item_id, "error": str(e)}
                            },
                            exc_info=True,
                        )  # exc_info=True still adds the full traceback
                        # --- ON FAILURE, UPDATE THE DOCUMENT WITH AN ERROR STATUS ---
                        error_update_data = {
                            "status": JobStatusEnum.FAILED,
                            "error_message": str(e),
                        }
                        await media_repo.update(media_item_id, error_update_data)

        loop.run_until_complete(_async_worker())
        loop.close()

    except Exception as e:
        worker_logger.error(
            "Video generation task failed.",
            extra={"json_fields": {"media_id": media_item_id, "error": str(e)}},
            exc_info=True,
        )  # exc_info=True still adds the full traceback


def _process_video_concatenation_in_background(
    media_item_id: int,
    request_dto: ConcatenateVideosDto,
):
    """
    Background worker to concatenate multiple videos.
    """
    import asyncio
    import os
    import sys
    from google.cloud.logging import Client as LoggerClient
    from google.cloud.logging.handlers import CloudLoggingHandler
    from src.database import WorkerDatabase
    from src.common.base_dto import AspectRatioEnum

    worker_logger = logging.getLogger(f"video_concat_worker.{media_item_id}")
    worker_logger.setLevel(logging.INFO)
    temp_dir = f"temp/{media_item_id}"

    try:
        if worker_logger.hasHandlers():
            worker_logger.handlers.clear()

        if os.getenv("ENVIRONMENT") == "production":
            log_client = LoggerClient()
            handler = CloudLoggingHandler(
                log_client, name=f"video_concat_worker.{media_item_id}"
            )
            worker_logger.addHandler(handler)
        else:
            handler = logging.StreamHandler(sys.stdout)
            formatter = logging.Formatter(
                "%(asctime)s - [CONCAT_WORKER] - %(levelname)s - %(message)s"
            )
            handler.setFormatter(formatter)
            worker_logger.addHandler(handler)

        # Create a new event loop for this process
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        async def _async_worker():
            async with WorkerDatabase() as db_factory:
                async with db_factory() as db:
                    media_repo = MediaRepository(db)
                    gcs_service = GcsService()
                    source_asset_repo = SourceAssetRepository(db)
                    cfg = config_service

                    try:
                        start_time = time.monotonic()
                        local_video_paths = []

                        # 1. Download all source videos
                        for video_input in request_dto.inputs:
                            gcs_uri: Optional[str] = None
                            if video_input.type == "media_item":
                                item = await media_repo.get_by_id(video_input.id)
                                if not item or not item.gcs_uris:
                                    raise ValueError(
                                        f"MediaItem '{video_input.id}' not found or has no video."
                                    )
                                gcs_uri = item.gcs_uris[0]
                            elif video_input.type == "source_asset":
                                asset = await source_asset_repo.get_by_id(video_input.id)
                                if not asset or not asset.gcs_uri:
                                    raise ValueError(
                                        f"SourceAsset '{video_input.id}' not found or has no video."
                                    )
                                gcs_uri = asset.gcs_uri

                            # Basic validation that it's a video URI
                            if not gcs_uri or not gcs_uri.endswith(
                                (".mp4", ".mov", ".webm")
                            ):
                                worker_logger.warning(
                                    f"Skipping non-video URI for {video_input.type} '{video_input.id}'"
                                )
                                continue

                            local_path = await asyncio.to_thread(
                                gcs_service.download_from_gcs,
                                gcs_uri_path=gcs_uri.replace(
                                    f"gs://{cfg.GENMEDIA_BUCKET}/", ""
                                ),
                                destination_file_path=f"{temp_dir}/{video_input.id}.mp4",
                            )
                            if not local_path:
                                raise Exception(f"Failed to download video: {gcs_uri}")
                            local_video_paths.append(local_path)

                        # 2. Concatenate them
                        final_video_path = f"{temp_dir}/final_concatenated.mp4"
                        concatenated_path = await asyncio.to_thread(
                            concatenate_videos,
                            video_paths=local_video_paths,
                            output_path=final_video_path
                        )
                        if not concatenated_path:
                            raise Exception("ffmpeg concatenation failed.")

                        # 3. Upload the final video
                        final_gcs_uri = await asyncio.to_thread(
                            gcs_service.upload_file_to_gcs,
                            local_path=concatenated_path,
                            destination_blob_name=f"concatenated_videos/{media_item_id}.mp4",
                            mime_type="video/mp4",
                        )
                        if not final_gcs_uri:
                            raise Exception("Failed to upload final concatenated video.")

                        # 4. Generate and upload thumbnail
                        thumbnail_path = await asyncio.to_thread(
                            generate_thumbnail, concatenated_path
                        )
                        thumbnail_gcs_uri = None
                        if thumbnail_path:
                            thumbnail_gcs_uri = await asyncio.to_thread(
                                gcs_service.upload_file_to_gcs,
                                local_path=thumbnail_path,
                                destination_blob_name=f"concatenated_videos/{media_item_id}_thumb.png",
                                mime_type="image/png",
                            )

                        end_time = time.monotonic()

                        # 5. Update the placeholder MediaItem
                        update_data = {
                            "status": JobStatusEnum.COMPLETED,
                            "gcs_uris": [final_gcs_uri],
                            "thumbnail_uris": (
                                [thumbnail_gcs_uri] if thumbnail_gcs_uri else []
                            ),
                            "generation_time": end_time - start_time,
                            "num_media": 1,
                        }
                        await media_repo.update(media_item_id, update_data)
                        worker_logger.info(
                            f"Successfully concatenated videos for job {media_item_id}"
                        )

                    except Exception as e:
                        worker_logger.error(
                            f"Video concatenation task failed: {e}", exc_info=True
                        )
                        error_update_data = {
                            "status": JobStatusEnum.FAILED,
                            "error_message": str(e),
                        }
                        await media_repo.update(media_item_id, error_update_data)
                    finally:
                        if os.path.exists(temp_dir):
                            shutil.rmtree(temp_dir)

        loop.run_until_complete(_async_worker())
        loop.close()

    except Exception as e:
        worker_logger.error(
            f"Video concatenation worker failed to initialize: {e}",
            exc_info=True,
        )


class VeoService:

    def __init__(
        self,
        media_repo: MediaRepository = Depends(),
        source_asset_repo: SourceAssetRepository = Depends(),
        gemini_service: GeminiService = Depends(),
        gcs_service: GcsService = Depends(),
        iam_signer_credentials: IamSignerCredentials = Depends(),
    ):
        """Initializes the service with its dependencies."""
        self.iam_signer_credentials = iam_signer_credentials
        self.media_repo = media_repo
        self.gemini_service = gemini_service
        self.gcs_service = gcs_service
        self.source_asset_repo = source_asset_repo

    async def start_video_generation_job(
        self,
        request_dto: CreateVeoDto,
        user: UserModel,
        executor: ThreadPoolExecutor,
    ) -> MediaItemResponse:
        """
        Immediately creates a placeholder MediaItem and starts the video generation
        in the background.

        Returns:
            The initial MediaItem with a 'processing' status and a pre-generated ID.
        """
        # 1. Prepare source asset links if they exist
        source_assets: List[SourceAssetLink] = []
        if request_dto.start_image_asset_id:
            source_assets.append(
                SourceAssetLink(
                    asset_id=request_dto.start_image_asset_id,
                    role=AssetRoleEnum.START_FRAME,
                )
            )
        if request_dto.end_image_asset_id:
            source_assets.append(
                SourceAssetLink(
                    asset_id=request_dto.end_image_asset_id,
                    role=AssetRoleEnum.END_FRAME,
                )
            )
        if request_dto.source_video_asset_id:
            source_assets.append(
                SourceAssetLink(
                    asset_id=request_dto.source_video_asset_id,
                    role=AssetRoleEnum.VIDEO_EXTENSION_SOURCE,
                )
            )

        if request_dto.reference_images:
            for ref_image in request_dto.reference_images:
                role = (
                    AssetRoleEnum.IMAGE_REFERENCE_STYLE
                    if ref_image.reference_type == ReferenceImageTypeEnum.STYLE
                    else AssetRoleEnum.IMAGE_REFERENCE_ASSET
                )
                source_assets.append(
                    SourceAssetLink(
                        asset_id=ref_image.asset_id,
                        role=role,
                    )
                )

        # 1. Create a placeholder MediaItem (without ID, let DB generate it)
        placeholder_item = MediaItemModel(
            workspace_id=request_dto.workspace_id,
            user_email=user.email,
            user_id=user.id,
            mime_type=MimeTypeEnum.VIDEO_MP4,
            model=request_dto.generation_model,
            original_prompt=request_dto.prompt,
            status=JobStatusEnum.PROCESSING,
            # Populate other known request parameters
            aspect_ratio=request_dto.aspect_ratio,
            style=request_dto.style,
            lighting=request_dto.lighting,
            color_and_tone=request_dto.color_and_tone,
            composition=request_dto.composition,
            negative_prompt=request_dto.negative_prompt,
            duration_seconds=request_dto.duration_seconds,
            source_media_items=request_dto.source_media_items or None,
            source_assets=source_assets or None,
            gcs_uris=[],
            thumbnail_uris=[],
        )

        # 2. Save to DB to get the ID
        placeholder_item = await self.media_repo.create(placeholder_item)

        # 3. Submit background task
        executor.submit(
            _process_video_in_background,
            media_item_id=placeholder_item.id,
            request_dto=request_dto,
            user_email=user.email,
        )

        logger.info(
            "Video generation job successfully queued.",
            extra={
                "json_fields": {
                    "message": "Video generation job successfully queued.",
                    "media_id": placeholder_item.id,
                    "user_email": user.email,
                    "user_id": user.id,
                    "model": request_dto.generation_model,
                }
            },
        )

        # 5. Return the placeholder to the frontend
        return MediaItemResponse(
            **placeholder_item.model_dump(),
            presigned_urls=[],
            presigned_thumbnail_urls=[],
        )

    async def start_video_concatenation_job(
        self,
        request_dto: ConcatenateVideosDto,
        user: UserModel,
        executor: ThreadPoolExecutor,
    ) -> MediaItemResponse:
        """
        Creates a placeholder for a video concatenation job and starts it in the background.
        """
        source_media_items: List[SourceMediaItemLink] = []
        source_assets: List[SourceAssetLink] = []

        for video_input in request_dto.inputs:
            if video_input.type == "media_item":
                source_media_items.append(
                    SourceMediaItemLink(
                        media_item_id=video_input.id,
                        media_index=0,
                        role=AssetRoleEnum.CONCATENATION_SOURCE,
                    )
                )
            elif video_input.type == "source_asset":
                source_assets.append(
                    SourceAssetLink(
                        asset_id=video_input.id,
                        role=AssetRoleEnum.CONCATENATION_SOURCE,
                    )
                )

        # 1. Create placeholder (let DB generate ID)
        placeholder_item = MediaItemModel(
            workspace_id=request_dto.workspace_id,
            user_email=user.email,
            user_id=user.id,
            mime_type=MimeTypeEnum.VIDEO_MP4,
            model=GenerationModelEnum.VEO_3_QUALITY,  # Or a specific concat model if exists
            original_prompt=request_dto.name,  # Use name as prompt
            status=JobStatusEnum.PROCESSING,
            source_media_items=source_media_items,
            source_assets=source_assets,
            gcs_uris=[],
            thumbnail_uris=[],
            aspect_ratio=request_dto.aspect_ratio,
            # We could store the input IDs in source_assets or raw_data for traceability
            raw_data={"concatenation_inputs": [i.model_dump() for i in request_dto.inputs]},
        )

        # 2. Save to DB
        placeholder_item = await self.media_repo.create(placeholder_item)

        # 3. Submit background task
        executor.submit(
            _process_video_concatenation_in_background,
            media_item_id=placeholder_item.id,
            request_dto=request_dto,
        )

        logger.info(f"Video concatenation job queued: {placeholder_item.id}")

        return MediaItemResponse(
            **placeholder_item.model_dump(),
            presigned_urls=[],
            presigned_thumbnail_urls=[],
        )

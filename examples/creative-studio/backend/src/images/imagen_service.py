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
import base64
import io
import logging
import os
import time
import random
import uuid
from typing import List, Optional, Literal

from fastapi import Depends

from google.cloud import aiplatform
from google.genai import Client, types
from PIL import Image as PILImage

from src.auth.iam_signer_credentials_service import IamSignerCredentials
from src.common.base_dto import (
    AspectRatioEnum,
    GenerationModelEnum,
    MimeTypeEnum,
)
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
from src.images.dto.create_imagen_dto import CreateImagenDto
from src.images.dto.upscale_imagen_dto import UpscaleImagenDto
from src.images.dto.vto_dto import VtoDto, VtoInputLink
from src.images.repository.media_item_repository import MediaRepository
from src.images.schema.imagen_result_model import (
    CustomImagenResult,
    ImageGenerationResult,
)
from src.multimodal.gemini_service import GeminiService, PromptTargetEnum
from src.source_assets.repository.source_asset_repository import (
    SourceAssetRepository,
)
from src.users.user_model import UserModel
from concurrent.futures import ThreadPoolExecutor
import sys

logger = logging.getLogger(__name__)



# --- STANDALONE WORKER FUNCTION FOR VTO ---
def _process_vto_in_background(
    media_item_id: int, request_dto: VtoDto, current_user: UserModel
):  # type: ignore
    """
    Long-running worker task for VTO generation. Creates its own service instances
    because it runs in a completely separate process.
    """
    import os
    import sys
    import asyncio
    from google.cloud.logging import Client as LoggerClient
    from google.cloud.logging.handlers import CloudLoggingHandler
    from src.database import AsyncSessionLocal

    worker_logger = logging.getLogger(f"vto_worker.{media_item_id}")
    worker_logger.setLevel(logging.INFO)

    try:
        # Clear any handlers that might be inherited from the parent process
        if worker_logger.hasHandlers():
            worker_logger.handlers.clear()

        if os.getenv("ENVIRONMENT") == "production":
            log_client = LoggerClient()
            handler = CloudLoggingHandler(
                log_client, name=f"vto_worker.{media_item_id}"
            )
            worker_logger.addHandler(handler)
        else:
            handler = logging.StreamHandler(sys.stdout)
            formatter = logging.Formatter(
                "%(asctime)s - [VTO_WORKER] - %(levelname)s - %(message)s"
            )
            handler.setFormatter(formatter)
            worker_logger.addHandler(handler)

        # Create a new event loop for this process
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        from src.database import WorkerDatabase

        async def _async_worker():
            async with WorkerDatabase() as db_factory:
                async with db_factory() as db:
                    # Create new instances of dependencies within this process
                    media_repo = MediaRepository(db)
                    iam_signer_credentials = IamSignerCredentials()
                    source_asset_repo = SourceAssetRepository(db)
                    cfg = config_service

                    try:
                        start_time = time.monotonic()
                        client = GenAIModelSetup.init()
                        gcs_output_directory = f"gs://{cfg.IMAGE_BUCKET}/{cfg.IMAGEN_RECONTEXT_SUBFOLDER}"

                        source_media_items: List[SourceMediaItemLink] = []  # type: ignore
                        source_assets: List[SourceAssetLink] = []

                        async def get_gcs_uri_from_input(
                            vto_input: VtoInputLink, role: AssetRoleEnum
                        ) -> str:
                            """Helper to get GCS URI from either source asset or media item."""
                            if vto_input.source_asset_id:
                                asset = await source_asset_repo.get_by_id(vto_input.source_asset_id)
                                if not asset:
                                    raise ValueError(
                                        f"Source asset {vto_input.source_asset_id} not found."
                                    )
                                source_assets.append(
                                    SourceAssetLink(asset_id=asset.id, role=role)
                                )
                                return asset.gcs_uri

                            elif vto_input.source_media_item:
                                media_item_link = vto_input.source_media_item
                                parent_item = await media_repo.get_by_id(
                                    media_item_link.media_item_id
                                )
                                if (
                                    not parent_item
                                    or not parent_item.gcs_uris
                                    or not (
                                        0
                                        <= media_item_link.media_index
                                        < len(parent_item.gcs_uris)
                                    )
                                ):
                                    raise ValueError(
                                        f"Source media item {media_item_link.media_item_id} not found or index is invalid."
                                    )

                                source_media_items.append(
                                    SourceMediaItemLink(
                                        media_item_id=media_item_link.media_item_id,
                                        media_index=media_item_link.media_index,
                                        role=role,
                                    )
                                )
                                return parent_item.gcs_uris[media_item_link.media_index]

                            raise ValueError("Invalid VTO input provided.")

                        # --- Set up the iterative VTO process ---
                        current_person_gcs_uri = await get_gcs_uri_from_input(
                            request_dto.person_image, AssetRoleEnum.VTO_PERSON
                        )

                        # Define the order of garment application
                        garment_inputs = [
                            (request_dto.top_image, AssetRoleEnum.VTO_TOP),
                            (request_dto.bottom_image, AssetRoleEnum.VTO_BOTTOM),
                            (request_dto.dress_image, AssetRoleEnum.VTO_DRESS),
                            (request_dto.shoe_image, AssetRoleEnum.VTO_SHOE),
                        ]
                        active_garments = [
                            (inp, role) for inp, role in garment_inputs if inp is not None
                        ]

                        final_response = None

                        # --- Loop through each garment and apply it sequentially ---
                        for i, (garment_input, role) in enumerate(active_garments):
                            if garment_input:
                                garment_gcs_uri = await get_gcs_uri_from_input(garment_input, role)
                                person_image_part = types.Image(gcs_uri=current_person_gcs_uri)
                                product_image_part = types.ProductImage(
                                    product_image=types.Image(gcs_uri=garment_gcs_uri)
                                )

                                worker_logger.info(
                                    f"Applying garment {i+1}/{len(active_garments)} with role {role}"
                                )

                                # Run sync API call in thread to avoid blocking the loop
                                response = await asyncio.to_thread(
                                    client.models.recontext_image,
                                    model=cfg.VTO_MODEL_ID,
                                    source=types.RecontextImageSource(
                                        person_image=person_image_part,
                                        product_images=[product_image_part],
                                    ),
                                    config=types.RecontextImageConfig(
                                        output_gcs_uri=gcs_output_directory,
                                        number_of_images=request_dto.number_of_media,
                                    ),
                                )

                                if i == len(active_garments) - 1:
                                    final_response = response
                                elif (
                                    response.generated_images
                                    and response.generated_images[0].image
                                ):
                                    current_person_gcs_uri = response.generated_images[
                                        0
                                    ].image.gcs_uri

                        if not final_response:
                            raise ValueError(
                                "VTO generation failed to produce a final result."
                            )

                        all_generated_images = final_response.generated_images or []

                        if not all_generated_images:
                            raise ValueError("No images generated from VTO process.")

                        # Process results
                        valid_generated_images = [
                            img
                            for img in all_generated_images
                            if img.image and img.image.gcs_uri
                        ]
                        mime_type: MimeTypeEnum = (
                            MimeTypeEnum.IMAGE_PNG
                            if valid_generated_images[0].image
                            and valid_generated_images[0].image.mime_type
                            == MimeTypeEnum.IMAGE_PNG
                            else MimeTypeEnum.IMAGE_JPEG
                        )

                        permanent_gcs_uris = [
                            img.image.gcs_uri
                            for img in valid_generated_images
                            if img.image and img.image.gcs_uri
                        ]

                        # Generate presigned URLs
                        presigned_urls = [
                            iam_signer_credentials.generate_presigned_url(uri)
                            for uri in permanent_gcs_uris
                        ]

                        end_time = time.monotonic()
                        generation_time = end_time - start_time

                        # Update the document with completed status
                        update_data = {
                            "status": JobStatusEnum.COMPLETED,
                            "gcs_uris": permanent_gcs_uris,
                            "generation_time": generation_time,
                            "num_media": len(permanent_gcs_uris),
                            "mime_type": mime_type,
                            "source_assets": (
                                [item.model_dump() for item in source_assets]
                                if source_assets
                                else None
                            ),
                            "source_media_items": (
                                [item.model_dump() for item in source_media_items]
                                if source_media_items
                                else None
                            ),
                        }
                        await media_repo.update(media_item_id, update_data)
                        worker_logger.info(
                            "Successfully processed VTO job.",
                            extra={
                                "json_fields": {
                                    "media_id": media_item_id,
                                    "generation_time_seconds": generation_time,
                                    "images_generated": len(permanent_gcs_uris),
                                }
                            },
                        )

                    except Exception as e:
                        worker_logger.error(
                            "VTO generation task failed.",
                            extra={
                                "json_fields": {"media_id": media_item_id, "error": str(e)}
                            },
                            exc_info=True,
                        )
                        error_update_data = {
                            "status": JobStatusEnum.FAILED,
                            "error_message": str(e),
                        }
                        await media_repo.update(media_item_id, error_update_data)

        loop.run_until_complete(_async_worker())
        loop.close()

    except Exception as e:
        worker_logger.error(
            "VTO worker failed to initialize.",
            extra={"json_fields": {"media_id": media_item_id, "error": str(e)}},
            exc_info=True,
        )


def gemini_flash_image_preview_generate_image(
    gcs_service: GcsService,
    vertexai_client: Client,
    prompt: str,
    model: Literal[
        GenerationModelEnum.GEMINI_2_5_FLASH_IMAGE_PREVIEW,
        GenerationModelEnum.GEMINI_3_PRO_IMAGE_PREVIEW,
    ],
    bucket_name: str,
    reference_images: Optional[List[types.Image]] = None,
    aspect_ratio: Optional[str] = None,
    google_search: bool = False,
    resolution: Optional[str] = None,
) -> types.GeneratedImage | None:
    """
    Generates an image using the Gemini API for text-to-image or image-to-image.
    This is a blocking function.

    Returns:
        A types.GeneratedImage object, or None if failed.
    """
    for attempt in range(3):
        try:
            # Build the parts for the content, including the prompt and any reference images
            parts = [types.Part.from_text(text=prompt)]
            if reference_images:
                for img in reference_images:
                    # The from_image helper was removed. We now use from_uri for GCS paths.
                    # The mime_type is automatically inferred by the SDK if not provided.
                    if img.gcs_uri:
                        parts.append(
                            types.Part.from_uri(
                                file_uri=img.gcs_uri, mime_type=img.mime_type
                            )
                        )

            contents: list[types.ContentUnionDict] = [
                types.Content(role="user", parts=parts)
            ]
            
            image_config = types.ImageConfig(
                aspect_ratio=aspect_ratio,
                image_size=resolution,
            )
            
            tools = []

            if google_search:
                tools.append(
                    types.Tool(
                    google_search=types.GoogleSearch()
                ))

            generate_content_config = types.GenerateContentConfig(
                response_modalities=["Text", "Image"],
                image_config=image_config,
                tools=tools if tools else None,
            )
            response: types.GenerateContentResponse = vertexai_client.models.generate_content(
                model=model,
                contents=contents,
                config=generate_content_config,
            )

            grounding_metadata = None

            for candidate in response.candidates:
                if candidate.grounding_metadata and candidate.grounding_metadata.grounding_chunks:
                    # Capture grounding metadata if present
                    grounding_metadata = candidate.grounding_metadata.model_dump()

                if candidate.content and candidate.content.parts:
                    for part in candidate.content.parts:
                        if part.inline_data:
                            # The API returns image data as a base64 encoded string
                            image_data_base64 = part.inline_data.data or ""
                            content_type = part.inline_data.mime_type or "image/png"

                            # Upload using our GCS service
                            image_url = gcs_service.store_to_gcs(
                                folder="gemini_images",
                                file_name=str(uuid.uuid4()),
                                mime_type=content_type,
                                contents=image_data_base64,
                                bucket_name=bucket_name,
                            )
                            if not image_url:
                                logger.debug("Error: image url not generated ")
                                return None, None

                            # Create a standard types.Image object
                            image_object = types.Image(
                                gcs_uri=image_url,
                                mime_type=content_type,
                            )
                            # Wrap it in a types.GeneratedImage and return along with grounding metadata
                            return types.GeneratedImage(image=image_object), grounding_metadata

            logger.debug("No image data found in the API response stream.")
            return None, None  # Return None if no image was found
        except Exception as e:
            if "429" in str(e) and attempt < 2:
                time.sleep(2**attempt + random.random())
                continue
            raise e


# --- STANDALONE WORKER FUNCTION ---
def _process_image_in_background(
    media_item_id: int, request_dto: CreateImagenDto, current_user: UserModel
):
    """
    Background worker to handle image generation, GCS upload, and DB update.
    """
    import os
    import sys
    import asyncio
    from google.cloud.logging import Client as LoggerClient
    from google.cloud.logging.handlers import CloudLoggingHandler
    from src.database import AsyncSessionLocal
    from src.brand_guidelines.repository.brand_guideline_repository import BrandGuidelineRepository

    worker_logger = logging.getLogger(f"image_worker.{media_item_id}")
    worker_logger.setLevel(logging.INFO)

    try:
        # Configure logging for the worker process
        if worker_logger.hasHandlers():
            worker_logger.handlers.clear()

        if os.getenv("ENVIRONMENT") == "production":
            log_client = LoggerClient()
            handler = CloudLoggingHandler(
                log_client, name=f"image_worker.{media_item_id}"
            )
            worker_logger.addHandler(handler)
        else:
            handler = logging.StreamHandler(sys.stdout)
            formatter = logging.Formatter(
                "%(asctime)s - [IMAGE_WORKER] - %(levelname)s - %(message)s"
            )
            handler.setFormatter(formatter)
            worker_logger.addHandler(handler)

        # Create a new event loop for this process
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        from src.database import WorkerDatabase

        async def _async_worker():
            async with WorkerDatabase() as db_factory:
                async with db_factory() as db:
                    # Create new instances of dependencies within this process
                    media_repo = MediaRepository(db)
                    source_asset_repo = SourceAssetRepository(db)
                    brand_guideline_repo = BrandGuidelineRepository(db)
                    gemini_service = GeminiService(brand_guideline_repo=brand_guideline_repo)
                    gcs_service = GcsService()
                    iam_signer_credentials = IamSignerCredentials()
                    cfg = config_service
                    
                    # Initialize GenAI client in the worker process
                    client = GenAIModelSetup.init()

                    # --- GENERATION LOGIC ---
                    start_time = time.monotonic()
                    gcs_output_directory = f"gs://{cfg.GENMEDIA_BUCKET}"

                    original_prompt = request_dto.prompt
                    rewritten_prompt = await gemini_service.enhance_prompt_from_dto(
                        dto=request_dto, target_type=PromptTargetEnum.IMAGE
                    )
                    request_dto.prompt = rewritten_prompt

                    source_assets: List[SourceAssetLink] = []
                    reference_images_for_api: List[types.Image] = []
                    grounding_metadata = None

                    if request_dto.source_asset_ids:
                        for asset_id in request_dto.source_asset_ids:
                            source_asset = await source_asset_repo.get_by_id(asset_id)
                            if source_asset:
                                source_assets.append(
                                    SourceAssetLink(
                                        asset_id=asset_id, role=AssetRoleEnum.INPUT
                                    )
                                )
                                reference_images_for_api.append(
                                    types.Image(
                                        gcs_uri=source_asset.gcs_uri,
                                        mime_type=source_asset.mime_type,
                                    )
                                )
                            else:
                                worker_logger.warning(
                                    f"Source asset with ID {asset_id} not found."
                                )

                    if request_dto.source_media_items:
                        for gen_input in request_dto.source_media_items:
                            parent_item = await media_repo.get_by_id(gen_input.media_item_id)
                            if (
                                parent_item
                                and parent_item.gcs_uris
                                and 0 <= gen_input.media_index < len(parent_item.gcs_uris)
                            ):
                                gcs_uri = parent_item.gcs_uris[gen_input.media_index]
                                reference_images_for_api.append(
                                    types.Image(
                                        gcs_uri=gcs_uri, mime_type=parent_item.mime_type
                                    )
                                )
                            else:
                                worker_logger.warning(
                                    f"Could not find or use generated_input: {gen_input.media_item_id} at index {gen_input.media_index}"
                                )

                    all_generated_images: List[types.GeneratedImage] = []

                    try:
                        # --- PATH 1: TEXT-TO-IMAGE GENERATION ---
                        if not reference_images_for_api:
                            if (
                                request_dto.generation_model
                                in [
                                    GenerationModelEnum.GEMINI_2_5_FLASH_IMAGE_PREVIEW,
                                    GenerationModelEnum.GEMINI_3_PRO_IMAGE_PREVIEW,
                                ]
                            ):
                                # --- GEMINI FLASH TEXT-TO-IMAGE ---
                                # Run async tasks in the worker's event loop
                                tasks = [
                                    asyncio.to_thread(
                                        gemini_flash_image_preview_generate_image,
                                        gcs_service=gcs_service,
                                        vertexai_client=client,
                                        prompt=request_dto.prompt,
                                        model=request_dto.generation_model,
                                        bucket_name=gcs_service.bucket_name,
                                        aspect_ratio=request_dto.aspect_ratio,
                                        google_search=request_dto.google_search,
                                        resolution=request_dto.resolution,
                                    )
                                    for _ in range(request_dto.number_of_media)
                                ]
                                gemini_images_response = await asyncio.gather(*tasks)
                                all_generated_images = [
                                    img for img, _ in gemini_images_response if img
                                ]
                                # Store grounding metadata from the first image (assuming it applies to all in the batch for now)
                                if gemini_images_response and gemini_images_response[0][1]:
                                    grounding_metadata = gemini_images_response[0][1]
                            else:
                                # --- OTHER IMAGEN MODELS (TEXT-TO-IMAGE): Single Batch API Call ---
                                for attempt in range(3):
                                    try:
                                        images_imagen_response = await asyncio.to_thread(
                                            client.models.generate_images,
                                            model=request_dto.generation_model,
                                            prompt=request_dto.prompt,
                                            config=types.GenerateImagesConfig(
                                                number_of_images=request_dto.number_of_media,
                                                output_gcs_uri=gcs_output_directory,
                                                aspect_ratio=request_dto.aspect_ratio,
                                                negative_prompt=request_dto.negative_prompt,
                                                add_watermark=request_dto.add_watermark,
                                                image_size="2K",
                                            ),
                                        )
                                        break
                                    except Exception as e:
                                        if "429" in str(e) and attempt < 2:
                                            time.sleep(2**attempt + random.random())
                                            continue
                                        raise e
                                all_generated_images = (
                                    images_imagen_response.generated_images or []
                                )
                        # --- PATH 2: IMAGE EDITING (IMAGE-TO-IMAGE) ---
                        else:
                            if (
                                request_dto.generation_model
                                in [
                                    GenerationModelEnum.GEMINI_2_5_FLASH_IMAGE_PREVIEW,
                                    GenerationModelEnum.GEMINI_3_PRO_IMAGE_PREVIEW,
                                ]
                            ):
                                # --- GEMINI FLASH IMAGE-TO-IMAGE ---
                                tasks = [
                                    asyncio.to_thread(
                                        gemini_flash_image_preview_generate_image,
                                        gcs_service=gcs_service,
                                        vertexai_client=client,
                                        model=request_dto.generation_model,
                                        prompt=request_dto.prompt,
                                        bucket_name=gcs_service.bucket_name,
                                        reference_images=reference_images_for_api,
                                        aspect_ratio=request_dto.aspect_ratio,
                                        google_search=request_dto.google_search,
                                        resolution=request_dto.resolution,
                                    )
                                    for _ in range(request_dto.number_of_media)
                                ]
                                gemini_images_response = await asyncio.gather(*tasks)
                                all_generated_images = [
                                    img for img, _ in gemini_images_response if img
                                ]
                                # Store grounding metadata from the first image
                                if gemini_images_response and gemini_images_response[0][1]:
                                    grounding_metadata = gemini_images_response[0][1]
                            else:
                                # --- IMAGEN MODELS (IMAGE-TO-IMAGE) ---
                                # The DTO validation ensures we only have one source image here.
                                raw_ref_image = types._ReferenceImageAPI(
                                    reference_id=1,
                                    reference_image=reference_images_for_api[0],
                                )
                                for attempt in range(3):
                                    try:
                                        response = await asyncio.to_thread(
                                            client.models.edit_image,
                                            model=request_dto.generation_model,
                                            prompt=request_dto.prompt,
                                            reference_images=[raw_ref_image],
                                            config=types.EditImageConfig(
                                                edit_mode=types.EditMode.EDIT_MODE_DEFAULT,
                                                number_of_images=request_dto.number_of_media,
                                                output_gcs_uri=gcs_output_directory,
                                            ),
                                        )
                                        break
                                    except Exception as e:
                                        if "429" in str(e) and attempt < 2:
                                            time.sleep(2**attempt + random.random())
                                            continue
                                        raise e
                                all_generated_images.extend(response.generated_images or [])

                        if not all_generated_images:
                            await media_repo.update(
                                media_item_id,
                                {"status": JobStatusEnum.FAILED, "error_message": "No images generated"},
                            )
                            return

                        # --- UNIFIED PROCESSING AND SAVING ---
                        # Create the list of permanent GCS URIs and the response for the frontend
                        valid_generated_images = [
                            img
                            for img in all_generated_images
                            if img.image and img.image.gcs_uri
                        ]
                        mime_type: MimeTypeEnum = (
                            MimeTypeEnum.IMAGE_PNG
                            if valid_generated_images[0].image
                            and valid_generated_images[0].image.mime_type
                            == MimeTypeEnum.IMAGE_PNG
                            else MimeTypeEnum.IMAGE_JPEG
                        )

                        # 1. Upscale images if needed
                        if request_dto.upscale_factor:
                            upscale_dtos: list[UpscaleImagenDto] = [
                                UpscaleImagenDto(
                                    generation_model=request_dto.generation_model,
                                    user_image=img.image.gcs_uri or "",
                                    mime_type=(
                                        MimeTypeEnum.IMAGE_PNG
                                        if img.image.mime_type
                                        == MimeTypeEnum.IMAGE_PNG.value
                                        else MimeTypeEnum.IMAGE_JPEG
                                    ),
                                    upscale_factor=request_dto.upscale_factor,
                                )
                                for img in valid_generated_images
                                if img.image
                            ]
                            # Instantiate a temporary service to use its upscale_image method
                            service = ImagenService(
                                media_repo=media_repo,
                                source_asset_repo=source_asset_repo,
                                gemini_service=gemini_service,
                                gcs_service=gcs_service,
                                iam_signer_credentials=iam_signer_credentials
                            )
                            tasks = [
                                service.upscale_image(request_dto=dto) for dto in upscale_dtos
                            ]
                            upscale_images = await asyncio.gather(*tasks)

                            permanent_gcs_uris = [
                                img.image.gcs_uri
                                for img in upscale_images
                                if img and img.image and img.image.gcs_uri
                            ]
                        else:
                            permanent_gcs_uris = [
                                img.image.gcs_uri
                                for img in valid_generated_images
                                if img.image and img.image.gcs_uri
                            ]

                        end_time = time.monotonic()
                        generation_time = end_time - start_time

                        # Update the MediaItem in Firestore
                        update_data = {
                            "status": JobStatusEnum.COMPLETED,
                            "prompt": rewritten_prompt,
                            "gcs_uris": permanent_gcs_uris,
                            "generation_time": generation_time,
                            "num_media": len(permanent_gcs_uris),
                            "grounding_metadata": grounding_metadata,
                            "source_assets": [sa.model_dump() for sa in source_assets] if source_assets else None,
                            "source_media_items": [smi.model_dump() for smi in request_dto.source_media_items] if request_dto.source_media_items else None,
                            "mime_type": mime_type,
                        }
                        await media_repo.update(media_item_id, update_data)
                        worker_logger.info(f"Successfully processed image job {media_item_id}")

                    except Exception as e:
                        worker_logger.error(f"Image generation API call failed: {e}")
                        await media_repo.update(
                            media_item_id,
                            {"status": JobStatusEnum.FAILED, "error_message": str(e)},
                        )

        loop.run_until_complete(_async_worker())
        loop.close()

    except Exception as e:
        worker_logger.error(f"Image generation task failed: {e}", exc_info=True)
        # We can't easily update DB here if the loop failed or session failed, 
        # but we can try to create a fresh one if needed, or just log.
        # For now, just log as we might not have a loop.


class ImagenService:
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
        self.cfg = config_service

    async def start_image_generation_job(
        self,
        request_dto: CreateImagenDto,
        user: UserModel,
        executor: ThreadPoolExecutor,
    ) -> MediaItemResponse:
        """
        Immediately creates a placeholder MediaItem and starts the image generation
        in the background.
        """
        # Create a placeholder document
        placeholder_item = MediaItemModel(
            workspace_id=request_dto.workspace_id,
            user_email=user.email,
            user_id=user.id,
            mime_type=MimeTypeEnum.IMAGE_PNG,  # Default to PNG, will update if needed
            model=request_dto.generation_model,
            original_prompt=request_dto.prompt,
            status=JobStatusEnum.PROCESSING,
            aspect_ratio=request_dto.aspect_ratio,
            style=request_dto.style,
            lighting=request_dto.lighting,
            color_and_tone=request_dto.color_and_tone,
            composition=request_dto.composition,
            negative_prompt=request_dto.negative_prompt,
            google_search=request_dto.google_search,
            resolution=request_dto.resolution,
            gcs_uris=[],
        )

        # Save the placeholder to the database immediately
        placeholder_item = await self.media_repo.create(placeholder_item)

        # Submit the long-running function to the process pool
        executor.submit(
            _process_image_in_background,
            media_item_id=placeholder_item.id,
            request_dto=request_dto,
            current_user=user,
        )

        logger.info(
            "Image generation job successfully queued.",
            extra={
                "json_fields": {
                    "media_id": placeholder_item.id,
                    "user_email": user.email,
                    "model": request_dto.generation_model,
                }
            },
        )

        return MediaItemResponse(
            **placeholder_item.model_dump(),
            presigned_urls=[],
            presigned_thumbnail_urls=[],
        )


    async def start_vto_generation_job(
        self,
        request_dto: VtoDto,
        user: UserModel,
        executor: ThreadPoolExecutor,
    ) -> MediaItemResponse:
        """
        Immediately creates a placeholder MediaItem and starts the VTO generation
        in the background.

        Returns:
            The initial MediaItem with a 'processing' status and a pre-generated ID.
        """
        # 2. Create a placeholder document
        placeholder_item = MediaItemModel(
            workspace_id=request_dto.workspace_id,
            user_email=user.email,
            user_id=user.id,
            mime_type=MimeTypeEnum.IMAGE_PNG,
            model=GenerationModelEnum.VTO,
            aspect_ratio=AspectRatioEnum.RATIO_9_16,
            original_prompt="",
            prompt="",
            status=JobStatusEnum.PROCESSING,
            gcs_uris=[],
        )

        # 3. Save the placeholder to the database immediately
        placeholder_item = await self.media_repo.create(placeholder_item)

        # 4. Submit the long-running function to the process pool
        executor.submit(
            _process_vto_in_background,
            media_item_id=placeholder_item.id,
            request_dto=request_dto,
            current_user=user,
        )

        logger.info(
            "VTO generation job successfully queued.",
            extra={
                "json_fields": {
                    "message": "VTO generation job successfully queued.",
                    "media_id": placeholder_item.id,
                    "user_email": user.email,
                    "user_id": user.id,
                }
            },
        )

        # 5. Return the placeholder to the frontend
        return MediaItemResponse(
            **placeholder_item.model_dump(),
            presigned_urls=[],
        )

    async def get_media_item_with_presigned_urls(
        self, media_id: int
    ) -> Optional[MediaItemResponse]:
        """
        Fetches a MediaItem by its ID and enriches it with presigned URLs.

        Args:
            media_id: The unique ID of the media item.

        Returns:
            A MediaItemResponse object with presigned URLs, or None if not found.
        """
        # 1. Fetch the base document from Firestore
        media_item = self.media_repo.get_by_id(media_id)
        if not media_item:
            return None

        # 2. Create tasks to generate all presigned URLs in parallel
        presigned_url_tasks = [
            asyncio.to_thread(
                self.iam_signer_credentials.generate_presigned_url, uri
            )
            for uri in media_item.gcs_uris
        ]

        # 3. Execute all URL generation tasks concurrently
        presigned_urls = await asyncio.gather(*presigned_url_tasks)

        # 4. Construct the final response DTO
        return MediaItemResponse(
            **media_item.model_dump(),
            presigned_urls=presigned_urls,
        )

    async def generate_image_for_vto(
        self, request_dto: VtoDto, user: UserModel
    ) -> MediaItemResponse | None:
        """Generates a VTO image using the google.genai client."""
        start_time = time.monotonic()
        client = GenAIModelSetup.init()
        gcs_output_directory = f"gs://{self.cfg.IMAGE_BUCKET}/{self.cfg.IMAGEN_RECONTEXT_SUBFOLDER}"

        source_media_items: List[SourceMediaItemLink] = []  # type: ignore
        source_assets: List[SourceAssetLink] = []

        async def get_gcs_uri_from_input(
            vto_input: VtoInputLink, role: AssetRoleEnum
        ) -> str:
            """
            Helper to get GCS URI from either source asset or media item
            and populate the source link lists.
            """
            if vto_input.source_asset_id:
                asset = await asyncio.to_thread(
                    self.source_asset_repo.get_by_id, vto_input.source_asset_id
                )
                if not asset:
                    raise ValueError(
                        f"Source asset {vto_input.source_asset_id} not found."
                    )
                source_assets.append(
                    SourceAssetLink(asset_id=asset.id, role=role)
                )
                return asset.gcs_uri

            elif vto_input.source_media_item:
                media_item_link = vto_input.source_media_item
                parent_item = await asyncio.to_thread(
                    self.media_repo.get_by_id, media_item_link.media_item_id
                )
                if (
                    not parent_item
                    or not parent_item.gcs_uris
                    or not (
                        0
                        <= media_item_link.media_index
                        < len(parent_item.gcs_uris)
                    )
                ):
                    raise ValueError(
                        f"Source media item {media_item_link.media_item_id} not found or index is invalid."
                    )

                source_media_items.append(
                    SourceMediaItemLink(
                        media_item_id=media_item_link.media_item_id,
                        media_index=media_item_link.media_index,
                        role=role,
                    )
                )
                return parent_item.gcs_uris[media_item_link.media_index]

            raise ValueError("Invalid VTO input provided.")

        # --- Set up the iterative VTO process ---
        # The current person GCS URI will be updated after each garment application.
        current_person_gcs_uri = await get_gcs_uri_from_input(
            request_dto.person_image, AssetRoleEnum.VTO_PERSON
        )

        # Define the order of garment application.
        garment_inputs = [
            (request_dto.top_image, AssetRoleEnum.VTO_TOP),
            (request_dto.bottom_image, AssetRoleEnum.VTO_BOTTOM),
            (request_dto.dress_image, AssetRoleEnum.VTO_DRESS),
            (request_dto.shoe_image, AssetRoleEnum.VTO_SHOE),
        ]
        # Filter out any garments that were not provided in the request.
        active_garments = [
            (inp, role) for inp, role in garment_inputs if inp is not None
        ]

        final_response = None

        # --- Loop through each garment and apply it sequentially ---
        for i, (garment_input, role) in enumerate(active_garments):
            if garment_input:
                # Get the GCS URI for the current garment and log it as a source.
                garment_gcs_uri = await get_gcs_uri_from_input(
                    garment_input, role
                )

                # The person image is the result of the previous step.
                person_image_part = types.Image(gcs_uri=current_person_gcs_uri)

                # The product image is the current garment in the loop.
                product_image_part = types.ProductImage(
                    product_image=types.Image(gcs_uri=garment_gcs_uri)
                )

                # Call the VTO API for this single step.
                response = client.models.recontext_image(
                    model=self.cfg.VTO_MODEL_ID,
                    source=types.RecontextImageSource(
                        person_image=person_image_part,
                        product_images=[product_image_part],
                    ),
                    config=types.RecontextImageConfig(
                        output_gcs_uri=gcs_output_directory,
                        number_of_images=request_dto.number_of_media,
                    ),
                )

                # If this is the last garment, this is our final result.
                if i == len(active_garments) - 1:
                    final_response = response
                # Otherwise, update the person URI for the next iteration.
                elif (
                    response.generated_images
                    and response.generated_images[0].image
                ):
                    current_person_gcs_uri = response.generated_images[
                        0
                    ].image.gcs_uri

        try:
            # After the loop, process the final response.
            if not final_response:
                raise ValueError(
                    "VTO generation failed to produce a final result."
                )

            all_generated_images = final_response.generated_images or []

            if not all_generated_images:
                return None

            # --- UNIFIED PROCESSING AND SAVING ---
            # Create the list of permanent GCS URIs and the response for the frontend
            valid_generated_images = [
                img
                for img in all_generated_images
                if img.image and img.image.gcs_uri
            ]
            mime_type: MimeTypeEnum = (
                MimeTypeEnum.IMAGE_PNG
                if valid_generated_images[0].image
                and valid_generated_images[0].image.mime_type
                == MimeTypeEnum.IMAGE_PNG
                else MimeTypeEnum.IMAGE_JPEG
            )

            permanent_gcs_uris = [
                img.image.gcs_uri
                for img in valid_generated_images
                if img.image and img.image.gcs_uri
            ]

            # 2. Create and run tasks to generate all presigned URLs in parallel
            presigned_url_tasks = [
                asyncio.to_thread(
                    self.iam_signer_credentials.generate_presigned_url, uri
                )
                for uri in permanent_gcs_uris
            ]
            presigned_urls = await asyncio.gather(*presigned_url_tasks)

            end_time = time.monotonic()
            generation_time = end_time - start_time

            # Create and save a SINGLE MediaItem for the entire batch
            media_post_to_save = MediaItemModel(
                # Core Props
                workspace_id=request_dto.workspace_id,
                user_email=user.email,
                user_id=user.id,
                mime_type=mime_type,
                model=GenerationModelEnum.VTO,
                aspect_ratio=AspectRatioEnum.RATIO_9_16,
                # Common Props
                prompt="",
                original_prompt="",
                num_media=len(permanent_gcs_uris),
                generation_time=generation_time,
                gcs_uris=permanent_gcs_uris,
                status=JobStatusEnum.COMPLETED,
                source_assets=source_assets or None,
                source_media_items=source_media_items or None,
            )
            self.media_repo.save(media_post_to_save)

            return MediaItemResponse(
                **media_post_to_save.model_dump(),
                presigned_urls=presigned_urls,
            )

        except Exception as e:
            logger.error(f"Image generation API call failed: {e}")
            raise

    async def upscale_image(
        self, request_dto: UpscaleImagenDto
    ) -> ImageGenerationResult | None:
        """
        Upscale an image.
        """
        client = GenAIModelSetup.init()
        try:
            # --- Step 1: Perform the Upscale API Call ---
            image_for_api = types.Image(gcs_uri=request_dto.user_image)

            response = client.models.upscale_image(
                model=GenerationModelEnum.IMAGEN_3_002.value,
                image=image_for_api,
                upscale_factor=request_dto.upscale_factor,
                config=types.UpscaleImageConfig(
                    include_rai_reason=request_dto.include_rai_reason,
                    output_mime_type=MimeTypeEnum.IMAGE_PNG.value,
                ),
            )

            # --- Step 2: Process the response and save to GCS ---
            if (
                response.generated_images
                and response.generated_images[0].image
                and response.generated_images[0].image.image_bytes
            ):
                upscaled_bytes = response.generated_images[0].image.image_bytes
                # Create a unique filename for the upscaled image.
                original_filename = os.path.basename(
                    request_dto.user_image.split("?")[0]
                )
                upscaled_blob_name = f"upscaled_images/upscaled_{request_dto.upscale_factor}_{original_filename}"

                final_gcs_uri = self.gcs_service.upload_bytes_to_gcs(
                    upscaled_bytes, upscaled_blob_name, MimeTypeEnum.IMAGE_PNG
                )

                if not final_gcs_uri:
                    raise ValueError("Failed to upload upscaled image to GCS.")

                return ImageGenerationResult(
                    enhanced_prompt="",
                    rai_filtered_reason=response.generated_images[
                        0
                    ].rai_filtered_reason
                    or "",
                    image=CustomImagenResult(
                        gcs_uri=final_gcs_uri,
                        encoded_image="",
                        mime_type=MimeTypeEnum.IMAGE_PNG,
                        presigned_url="",
                    ),
                )
            else:
                raise ValueError(
                    "Image upscaling generation failed or returned no data."
                )

        except Exception as e:
            logger.error(f"Image upscaling generation API call failed: {e}")
            raise

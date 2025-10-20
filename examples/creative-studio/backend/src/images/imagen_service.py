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
import uuid
from typing import List, Optional

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
from src.images.dto.edit_imagen_dto import EditImagenDto
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

logger = logging.getLogger(__name__)


def gemini_flash_image_preview_generate_image(
    gcs_service: GcsService,
    vertexai_client: Client,
    prompt: str,
    bucket_name: str,
    reference_images: Optional[List[types.Image]] = None,
) -> types.GeneratedImage | None:
    """
    Generates an image using the Gemini API for text-to-image or image-to-image.
    This is a blocking function.

    Returns:
        A types.GeneratedImage object, or None if failed.
    """
    model = GenerationModelEnum.GEMINI_2_5_FLASH_IMAGE_PREVIEW

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
    generate_content_config = types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"]
    )
    stream = vertexai_client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    )

    for chunk in stream:
        if not chunk.candidates:
            continue
        for candidate in chunk.candidates:
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
                            logging.debug("Error: image url not generated ")
                            return None

                        # Create a standard types.Image object
                        image_object = types.Image(
                            gcs_uri=image_url,
                            mime_type=content_type,
                        )
                        # Wrap it in a types.GeneratedImage and return
                        return types.GeneratedImage(image=image_object)

    logging.debug("No image data found in the API response stream.")
    return None  # Return None if no image was found


class ImagenService:
    def __init__(self):
        """Initializes the service with its dependencies."""
        self.iam_signer_credentials = IamSignerCredentials()
        self.media_repo = MediaRepository()
        self.gemini_service = GeminiService()
        self.gcs_service = GcsService()
        self.source_asset_repo = SourceAssetRepository()
        self.cfg = config_service

    async def generate_images(
        self, request_dto: CreateImagenDto, user: UserModel
    ) -> MediaItemResponse | None:
        """
        Generates a batch of images and saves them as a single MediaItem document.
        """
        start_time = time.monotonic()

        client = GenAIModelSetup.init()
        gcs_output_directory = f"gs://{self.cfg.GENMEDIA_BUCKET}"

        original_prompt = request_dto.prompt
        rewritten_prompt = self.gemini_service.enhance_prompt_from_dto(
            dto=request_dto, target_type=PromptTargetEnum.IMAGE
        )
        request_dto.prompt = rewritten_prompt

        source_assets: List[SourceAssetLink] = []
        reference_images_for_api: List[types.Image] = []

        if request_dto.source_asset_ids:
            for asset_id in request_dto.source_asset_ids:
                source_asset = await asyncio.to_thread(
                    self.source_asset_repo.get_by_id, asset_id
                )
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
                    logger.warning(
                        f"Source asset with ID {asset_id} not found."
                    )

        if request_dto.source_media_items:
            for gen_input in request_dto.source_media_items:
                parent_item = await asyncio.to_thread(
                    self.media_repo.get_by_id, gen_input.media_item_id
                )
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
                    logger.warning(
                        f"Could not find or use generated_input: {gen_input.media_item_id} at index {gen_input.media_index}"
                    )

        all_generated_images: List[types.GeneratedImage] = []

        try:
            # --- PATH 1: TEXT-TO-IMAGE GENERATION ---
            if not reference_images_for_api:
                if (
                    request_dto.generation_model
                    == GenerationModelEnum.GEMINI_2_5_FLASH_IMAGE_PREVIEW
                ):
                    # --- GEMINI FLASH TEXT-TO-IMAGE ---
                    tasks = [
                        asyncio.to_thread(
                            gemini_flash_image_preview_generate_image,
                            gcs_service=self.gcs_service,
                            vertexai_client=client,
                            prompt=request_dto.prompt,
                            bucket_name=self.gcs_service.bucket_name,
                        )
                        for _ in range(request_dto.number_of_media)
                    ]
                    gemini_images_response = await asyncio.gather(*tasks)
                    all_generated_images = [
                        img for img in gemini_images_response if img
                    ]
                else:
                    # --- OTHER IMAGEN MODELS (TEXT-TO-IMAGE): Single Batch API Call ---
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
                    all_generated_images = (
                        images_imagen_response.generated_images or []
                    )
            # --- PATH 2: IMAGE EDITING (IMAGE-TO-IMAGE) ---
            else:
                if (
                    request_dto.generation_model
                    == GenerationModelEnum.GEMINI_2_5_FLASH_IMAGE_PREVIEW
                ):
                    # --- GEMINI FLASH IMAGE-TO-IMAGE ---
                    tasks = [
                        asyncio.to_thread(
                            gemini_flash_image_preview_generate_image,
                            gcs_service=self.gcs_service,
                            vertexai_client=client,
                            prompt=request_dto.prompt,
                            bucket_name=self.gcs_service.bucket_name,
                            reference_images=reference_images_for_api,
                        )
                        for _ in range(request_dto.number_of_media)
                    ]
                    gemini_images_response = await asyncio.gather(*tasks)
                    all_generated_images = [
                        img for img in gemini_images_response if img
                    ]
                else:
                    # --- IMAGEN MODELS (IMAGE-TO-IMAGE) ---
                    # The DTO validation ensures we only have one source image here.
                    raw_ref_image = types._ReferenceImageAPI(
                        reference_id=1,
                        reference_image=reference_images_for_api[0],
                    )
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
                    all_generated_images.extend(response.generated_images or [])

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
                upscale_images = []
                tasks = [
                    self.upscale_image(request_dto=dto) for dto in upscale_dtos
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
                user_email=user.email,
                user_id=user.id,
                mime_type=mime_type,
                model=request_dto.generation_model,
                workspace_id=request_dto.workspace_id,
                # Common Props
                prompt=rewritten_prompt,
                original_prompt=original_prompt,
                num_media=len(permanent_gcs_uris),
                generation_time=generation_time,
                aspect_ratio=request_dto.aspect_ratio,
                gcs_uris=permanent_gcs_uris,
                status=JobStatusEnum.COMPLETED,
                # Styling props
                style=request_dto.style,
                lighting=request_dto.lighting,
                color_and_tone=request_dto.color_and_tone,
                composition=request_dto.composition,
                negative_prompt=request_dto.negative_prompt,
                add_watermark=request_dto.add_watermark,
                source_assets=source_assets or None,
                source_media_items=request_dto.source_media_items or None,
            )
            self.media_repo.save(media_post_to_save)

            return MediaItemResponse(
                **media_post_to_save.model_dump(),
                presigned_urls=presigned_urls,
            )

        except Exception as e:
            logger.error(f"Image generation API call failed: {e}")
            raise

    async def _generate_with_gemini(
        self,
        client: Client,
        term: str,
        number_of_images: int,
        style: str,
    ) -> List[ImageGenerationResult]:
        response_gemini: List[ImageGenerationResult] = []
        try:
            gemini_prompt_text = f"Create an image with a style '{style}' based on this user prompt: {term}"

            for i in range(
                number_of_images
            ):  # Loop as many times as images wanted
                # Run the synchronous SDK call in a separate thread
                gemini_api_response = await asyncio.to_thread(
                    client.models.generate_content,
                    model="gemini-2.0-flash-preview-image-generation",
                    contents=gemini_prompt_text,
                    config=types.GenerateContentConfig(
                        response_modalities=["TEXT", "IMAGE"]
                    ),
                )

                for candidate in gemini_api_response.candidates or []:
                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            if (
                                part.inline_data is not None
                                and part.inline_data.mime_type
                                and part.inline_data.data
                                and part.inline_data.mime_type.startswith(
                                    "image/"
                                )
                            ):
                                encoded_image_bytes = base64.b64encode(
                                    part.inline_data.data
                                ).decode("utf-8")
                                generated_text_for_prompt = ""
                                for p_text in candidate.content.parts:
                                    if p_text.text is not None:
                                        generated_text_for_prompt += (
                                            p_text.text + " "
                                        )

                                finish_reason_str = (
                                    candidate.finish_reason.name
                                    if candidate.finish_reason
                                    else None
                                )
                                if (
                                    gemini_api_response.prompt_feedback
                                    and gemini_api_response.prompt_feedback.block_reason
                                ):
                                    block_reason = (
                                        gemini_api_response.prompt_feedback.block_reason
                                    )
                                    block_reason_message = (
                                        gemini_api_response.prompt_feedback.block_reason_message
                                    )
                                    finish_reason_str = (
                                        block_reason_message
                                        or (
                                            block_reason.name
                                            if block_reason
                                            else "Blocked"
                                        )
                                    )

                                response_gemini.append(
                                    ImageGenerationResult(
                                        enhanced_prompt=generated_text_for_prompt.strip()
                                        or gemini_prompt_text,
                                        rai_filtered_reason=finish_reason_str,
                                        image=CustomImagenResult(
                                            gcs_uri=None,
                                            encoded_image=encoded_image_bytes,
                                            mime_type=part.inline_data.mime_type,
                                            presigned_url="",
                                        ),
                                    )
                                )
                            elif part.text is not None:
                                logger.info(
                                    f"Gemini Text Output (not an image part): {part.text}"
                                )

            logger.info(
                f"Number of images created by Gemini: {len(response_gemini)}"
            )
            return response_gemini
        except Exception as e:
            logger.error(f"Error during Gemini generation: {e}")
            return []

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

    def recontextualize_product_in_scene(
        self, image_uris_list: list[str], prompt: str, sample_count: int
    ) -> list[str]:
        """Recontextualizes a product in a scene and returns a list of GCS URIs."""
        client_options = {
            "api_endpoint": f"{self.cfg.LOCATION}-aiplatform.googleapis.com"
        }
        client = aiplatform.gapic.PredictionServiceClient(
            client_options=client_options
        )

        model_endpoint = f"projects/{self.cfg.PROJECT_ID}/locations/{self.cfg.LOCATION}/publishers/google/models/{self.cfg.MODEL_IMAGEN_PRODUCT_RECONTEXT}"

        instance = {"productImages": []}
        for product_image_uri in image_uris_list:
            product_image = {"image": {"gcsUri": product_image_uri}}
            instance["productImages"].append(product_image)

        if prompt:
            instance["prompt"] = prompt  # type: ignore

        parameters = {"sampleCount": sample_count}

        response = client.predict(
            endpoint=model_endpoint, instances=[instance], parameters=parameters  # type: ignore
        )

        gcs_uris = []
        for prediction in response.predictions:
            if prediction.get("bytesBase64Encoded"):  # type: ignore
                encoded_mask_string = prediction["bytesBase64Encoded"]  # type: ignore
                mask_bytes = base64.b64decode(encoded_mask_string)

                gcs_uri = self.gcs_service.store_to_gcs(
                    folder="recontext_results",
                    file_name=f"recontext_result_{uuid.uuid4()}.png",
                    mime_type="image/png",
                    contents=mask_bytes,
                    decode=False,
                )
                gcs_uris.append(gcs_uri)

        return gcs_uris

    def edit_image(
        self, request_dto: EditImagenDto
    ) -> list[ImageGenerationResult]:
        """Edits an image using the Google GenAI client."""
        client = GenAIModelSetup.init()
        gcs_output_directory = (
            f"gs://{self.cfg.IMAGE_BUCKET}/{self.cfg.IMAGEN_EDITED_SUBFOLDER}"
        )

        raw_ref_image = types.RawReferenceImage(
            reference_id=1,
            reference_image=types.Image(
                image_bytes=request_dto.user_image,
            ),
        )

        mask_ref_image = types.MaskReferenceImage(
            reference_id=2,
            config=types.MaskReferenceConfig(
                mask_mode=request_dto.mask_mode,
                mask_dilation=0,
            ),
        )

        try:
            logger.info(
                f"models.image_models.edit_image: Requesting {request_dto.number_of_media} edited images for model {request_dto.generation_model} with output to {gcs_output_directory}"
            )
            images_imagen_response = client.models.edit_image(
                model=request_dto.generation_model,
                prompt=request_dto.prompt,
                reference_images=[raw_ref_image, mask_ref_image],  # type: ignore
                config=types.EditImageConfig(
                    edit_mode=request_dto.edit_mode,
                    number_of_images=request_dto.number_of_media,
                    include_rai_reason=True,
                    output_gcs_uri=gcs_output_directory,
                    output_mime_type="image/jpeg",
                ),
            )

            response_imagen = []
            for generated_image in (
                images_imagen_response.generated_images or []
            ):
                if generated_image.image:
                    response_imagen.append(
                        ImageGenerationResult(
                            enhanced_prompt=generated_image.enhanced_prompt
                            or "",
                            rai_filtered_reason=generated_image.rai_filtered_reason,
                            image=CustomImagenResult(
                                gcs_uri=generated_image.image.gcs_uri,
                                presigned_url=self.iam_signer_credentials.generate_presigned_url(
                                    generated_image.image.gcs_uri
                                ),
                                encoded_image="",
                                mime_type=generated_image.image.mime_type or "",
                            ),
                        )
                    )

            logger.info(
                f"Number of images created by Imagen: {len(response_imagen)}"
            )
            return response_imagen
        except Exception as e:
            logger.error(f"API call failed: {e}")
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

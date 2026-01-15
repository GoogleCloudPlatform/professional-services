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

from enum import Enum
from typing import Optional

from fastapi import Query
from google.genai import types
from pydantic import Field, ValidationInfo, field_validator
from typing_extensions import Annotated

from src.common.base_dto import (
    AspectRatioEnum,
    BaseDto,
    ColorAndToneEnum,
    CompositionEnum,
    GenerationModelEnum,
    LightingEnum,
    ReferenceImageTypeEnum,
    StyleEnum,
)
from src.common.schema.media_item_model import (
    AssetRoleEnum,
    SourceMediaItemLink,
)


class ReferenceImageDto(BaseDto):
    asset_id: int = Field(
        description="The ID of the SourceAsset to use as a reference."
    )
    reference_type: ReferenceImageTypeEnum = Field(
        default=ReferenceImageTypeEnum.ASSET
    )


class CreateVeoDto(BaseDto):
    """
    The refactored request model. Defaults are defined here to make the API
    contract explicit and self-documenting.
    """

    prompt: Annotated[str, Query(max_length=10000)] = Field(
        description="Prompt term to be passed to the model"
    )
    workspace_id: int = Field(
        ge=1, description="The ID of the workspace for this generation."
    )
    generation_model: GenerationModelEnum = Field(
        default=GenerationModelEnum.VEO_3_1_PREVIEW,
        description="Model used for image generation.",
    )
    aspect_ratio: AspectRatioEnum = Field(
        default=AspectRatioEnum.RATIO_16_9,
        description="Aspect ratio of the image.",
    )
    number_of_media: int = Field(
        default=1,
        ge=1,
        le=4,
        description="Number of videos to generate (between 1 and 4).",
    )
    style: Optional[StyleEnum] = Field(
        default=None, description="Style of the image."
    )
    negative_prompt: str = Field(
        default="", description="Negative prompt for the image."
    )
    color_and_tone: Optional[ColorAndToneEnum] = Field(
        default=None,
        description="The desired color and tone style for the image.",
    )
    lighting: Optional[LightingEnum] = Field(
        default=None, description="The desired lighting style for the image."
    )
    composition: Optional[CompositionEnum] = Field(
        default=None, description="The desired lighting style for the image."
    )
    generate_audio: bool = Field(
        default=False,
        description="Whether to add audio to the generated video.",
    )
    duration_seconds: int = Field(
        default=1,
        ge=1,
        le=8,
        description="Duration in seconds for the videos to generate (between 1 and 8 secs).",
    )
    start_image_asset_id: Optional[int] = Field(
        default=None,
        description="The ID of the SourceAsset to use as the starting image.",
    )
    end_image_asset_id: Optional[int] = Field(
        default=None,
        description="The ID of the SourceAsset to use as the ending image.",
    )
    source_video_asset_id: Optional[int] = Field(
        default=None,
        description="The ID of the SourceAsset to use as the source video.",
    )
    source_media_items: Optional[list[SourceMediaItemLink]] = Field(
        default=None,
        description="A list of previously generated media items (from the gallery) to be used as inputs (e.g., start/end frames).",
    )
    use_brand_guidelines: bool = Field(
        default=False,
        description="Whether to prepend brand guidelines to the prompt.",
    )
    reference_images: Optional[list[ReferenceImageDto]] = Field(
        default=None,
        max_length=3,
        description="A list of reference images, each with an ID and a type (ASSET or STYLE).",
    )

    @field_validator("source_media_items")
    def validate_source_media_items(
        cls, value: Optional[list[SourceMediaItemLink]], info: ValidationInfo
    ) -> Optional[list[SourceMediaItemLink]]:
        """
        Performs several validations:
        1. Ensures that source_media_items have a valid role.
        2. Ensures the total number of reference images does not exceed 3.
        3. Ensures reference images (from any source) are not used with start/end frames or source videos.
        4. Ensures reference image roles are only used with the correct model.
        """
        # The `validate_source_media_items` validator handles all reference sources
        # (source assets and media items) in one place.
        # This validator is kept to ensure the field is processed, but the core logic is moved.
        conflicting_roles_present = False
        reference_roles_present = False
        model = info.data.get("generation_model")

        if value:
            non_reference_roles = {
                AssetRoleEnum.START_FRAME,
                AssetRoleEnum.END_FRAME,
                AssetRoleEnum.VIDEO_EXTENSION_SOURCE,
            }
            reference_roles = {
                AssetRoleEnum.IMAGE_REFERENCE_ASSET,
                AssetRoleEnum.IMAGE_REFERENCE_STYLE,
            }
            valid_roles = non_reference_roles.union(reference_roles)

            for item in value:
                if item.role not in valid_roles:
                    raise ValueError(
                        f"Invalid role '{item.role}' for source_media_item."
                    )
                if item.role in non_reference_roles:
                    conflicting_roles_present = True
                if item.role in reference_roles:
                    reference_roles_present = True

        # The validator now correctly checks both `reference_images` and reference roles in `source_media_items`
        has_asset_references = bool(info.data.get("reference_images"))
        has_any_references = has_asset_references or reference_roles_present

        if has_any_references:
            # Enforce model compatibility for any reference image usage
            if (
                model != GenerationModelEnum.VEO_2_GENERATE_EXP
                and model != GenerationModelEnum.VEO_3_1_PREVIEW
            ):
                raise ValueError(
                    "Reference images are only supported by the "
                    f"'{GenerationModelEnum.VEO_3_1_PREVIEW.value}' model."
                )

            # Check for other conflicting fields from the main DTO
            start_image_present = bool(info.data.get("start_image_asset_id"))
            end_image_present = bool(info.data.get("end_image_asset_id"))
            source_video_present = bool(info.data.get("source_video_asset_id"))

            if (
                start_image_present
                or end_image_present
                or source_video_present
                or conflicting_roles_present
            ):
                raise ValueError(
                    "Reference images cannot be used at the same time as a start frame, end frame, or source video."
                )

        return value

    @field_validator("aspect_ratio")
    def validate_video_aspect_ratio(
        cls, value: AspectRatioEnum
    ) -> AspectRatioEnum:
        """Ensures that only supported aspect ratios for video are used."""
        valid_video_ratios = [
            AspectRatioEnum.RATIO_16_9,
            AspectRatioEnum.RATIO_9_16,
        ]
        if value not in valid_video_ratios:
            raise ValueError(
                "Invalid aspect ratio for video. Only '16:9' and '9:16' are supported."
            )
        return value

    @field_validator("generation_model")
    def validate_video_generation_model(
        cls, value: GenerationModelEnum
    ) -> GenerationModelEnum:
        """Ensures that only supported generation models for video are used."""
        valid_video_ratios = [
            GenerationModelEnum.VEO_3_1_PREVIEW,
            GenerationModelEnum.VEO_3_FAST,
            GenerationModelEnum.VEO_3_QUALITY,
            GenerationModelEnum.VEO_3_FAST_PREVIEW,
            GenerationModelEnum.VEO_3_QUALITY_PREVIEW,
            GenerationModelEnum.VEO_2_FAST,
            GenerationModelEnum.VEO_2_QUALITY,
            GenerationModelEnum.VEO_2_GENERATE_EXP,
        ]
        if value not in valid_video_ratios:
            raise ValueError("Invalid generation model for video.")
        return value

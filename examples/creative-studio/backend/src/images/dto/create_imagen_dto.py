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

from typing import Annotated, Literal, Optional

from fastapi import Query
from google.genai import types
from pydantic import Field, field_validator, model_validator

from src.common.base_dto import (
    AspectRatioEnum,
    BaseDto,
    ColorAndToneEnum,
    CompositionEnum,
    GenerationModelEnum,
    LightingEnum,
    StyleEnum,
)
from src.common.schema.media_item_model import SourceMediaItemLink


class CreateImagenDto(BaseDto):
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
        default=GenerationModelEnum.IMAGEN_4_ULTRA,
        description="Model used for image generation.",
    )
    aspect_ratio: AspectRatioEnum = Field(
        default=AspectRatioEnum.RATIO_1_1,
        description="Aspect ratio of the image.",
    )
    number_of_media: int = Field(
        default=1,
        ge=1,
        le=4,
        description="Number of images to generate (between 1 and 4).",
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
    add_watermark: bool = Field(
        default=False,
        description="Whether to add a watermark to the generated image.",
    )
    upscale_factor: Literal["", "x2", "x4"] = Field(
        default="",
        description="""Factor of the upscale, either x2 or x4. If empty it will not upscale""",
    )
    source_asset_ids: Optional[Annotated[list[int], Field(max_length=14)]] = (
        Field(
            default=None,
            description="A list of source asset IDs to be used as input for image-to-image generation.",
        )
    )
    source_media_items: Optional[
        Annotated[list[SourceMediaItemLink], Field(max_length=14)]
    ] = Field(
        default=None,
        description="A list of previously generated media items (from the gallery) to be used as inputs for the new generation.",
    )
    use_brand_guidelines: bool = Field(
        default=False,
        description="Whether to prepend brand guidelines to the prompt.",
    )
    google_search: bool = Field(
        default=False,
        description="Whether to use Google Search for image generation.",
    )
    resolution: Literal["1K", "2K", "4K"] = Field(
        default="4K",
        description="Resolution of the generated image.",
    )

    @field_validator("prompt")
    def prompt_must_not_be_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Prompt cannot be empty or whitespace only")
        return value

    @field_validator("generation_model")
    def validate_imagen_generation_model(
        cls, value: GenerationModelEnum
    ) -> GenerationModelEnum:
        """Ensures that only supported generation models for imagen are used."""
        valid_generation_models = [
            GenerationModelEnum.IMAGEGEN_002,
            GenerationModelEnum.IMAGEGEN_005,
            GenerationModelEnum.IMAGEGEN_006,
            GenerationModelEnum.IMAGEN_3_001,
            GenerationModelEnum.IMAGEN_3_002,
            GenerationModelEnum.IMAGEN_3_FAST,
            GenerationModelEnum.IMAGEN_4_FAST,
            GenerationModelEnum.IMAGEN_4_ULTRA,
            GenerationModelEnum.IMAGEN_4_001,
            GenerationModelEnum.GEMINI_2_5_FLASH_IMAGE_PREVIEW,
            GenerationModelEnum.GEMINI_3_PRO_IMAGE_PREVIEW,
        ]
        if value not in valid_generation_models:
            raise ValueError("Invalid generation model for imagen.")
        return value

    @model_validator(mode="after")
    def validate_inputs(self) -> "CreateImagenDto":
        """
        Validates the total number of inputs and model compatibility.
        - The total number of inputs (source_asset_ids + source_media_items) cannot exceed 14 for Gemini 3 Pro.
        - For non-Gemini models, only one input is allowed, and the model must support editing.
        - Aspect ratio validation based on model.
        """
        source_assets_count = (
            len(self.source_asset_ids) if self.source_asset_ids else 0
        )
        generated_inputs_count = (
            len(self.source_media_items) if self.source_media_items else 0
        )
        total_inputs = source_assets_count + generated_inputs_count

        is_gemini_3_pro = (
            self.generation_model == GenerationModelEnum.GEMINI_3_PRO_IMAGE_PREVIEW
        )
        is_gemini_flash = (
            self.generation_model == GenerationModelEnum.GEMINI_2_5_FLASH_IMAGE_PREVIEW
        )

        # Aspect Ratio Validation
        allowed_ratios_gemini_3 = [
            AspectRatioEnum.RATIO_1_1,
            AspectRatioEnum.RATIO_3_4,
            AspectRatioEnum.RATIO_4_3,
            AspectRatioEnum.RATIO_2_3,
            AspectRatioEnum.RATIO_3_2,
            AspectRatioEnum.RATIO_4_5,
            AspectRatioEnum.RATIO_5_4,
            AspectRatioEnum.RATIO_9_16,
            AspectRatioEnum.RATIO_16_9,
            AspectRatioEnum.RATIO_21_9,
        ]
        
        if is_gemini_3_pro:
            if self.aspect_ratio not in allowed_ratios_gemini_3:
                 raise ValueError(
                    f"Aspect ratio {self.aspect_ratio} is not supported for Gemini 3 Pro."
                )
        elif is_gemini_flash:
            if self.aspect_ratio != AspectRatioEnum.RATIO_1_1:
                raise ValueError(
                    f"Aspect ratio {self.aspect_ratio} is not supported for Gemini Flash. Only 1:1 is supported."
                )
        else: # Imagen models
            allowed_ratios_imagen = [
                AspectRatioEnum.RATIO_1_1,
                AspectRatioEnum.RATIO_3_4,
                AspectRatioEnum.RATIO_4_3,
                AspectRatioEnum.RATIO_9_16,
                AspectRatioEnum.RATIO_16_9,
            ]
            if self.aspect_ratio not in allowed_ratios_imagen:
                raise ValueError(
                    f"Aspect ratio {self.aspect_ratio} is not supported for Imagen models."
                )

        if total_inputs == 0:
            return self  # No inputs, nothing to validate here.

        if is_gemini_3_pro:
            if total_inputs > 14:
                raise ValueError(
                    "A maximum of 14 total inputs are allowed for Gemini 3 Pro."
                )
        elif is_gemini_flash:
            if total_inputs > 2:
                raise ValueError(
                    "A maximum of 2 total inputs are allowed for Gemini Flash."
                )
        else:  # It's an Imagen model
            if total_inputs > 1:
                raise ValueError(
                    "Only one total input (source asset or generated input) is allowed for image editing with Imagen models."
                )
            allowed_editing_models = [
                GenerationModelEnum.IMAGEN_3_FAST,
                GenerationModelEnum.IMAGEN_3_002,
            ]
            if self.generation_model not in allowed_editing_models:
                raise ValueError(
                    f"Model '{self.generation_model.value}' does not support image editing with Imagen. "
                    "Please use 'imagen-3.0-fast-generate-001' or 'imagen-3.0-generate-002'."
                )

        return self

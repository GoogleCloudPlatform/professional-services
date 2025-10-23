# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from fastapi import APIRouter
from src.common.base_dto import (
    AspectRatioEnum,
    CompositionEnum,
    GenerationModelEnum,
    StyleEnum,
)
from src.generation_options.dto.generation_options_dto import (
    GenerationOptionsResponse,
)
from src.images.dto.create_imagen_dto import LightingEnum, ColorAndToneEnum

router = APIRouter(
    prefix="/api/options",
    tags=["Generation Options"],
)


@router.get("/image-generation", response_model=GenerationOptionsResponse)
async def get_image_generation_options():
    """
    Provides a list of available options for the image generation UI,
    dynamically sourced from the backend enums.
    """
    return GenerationOptionsResponse(
        generation_models=[member.value for member in GenerationModelEnum],
        aspect_ratios=[member.value for member in AspectRatioEnum],
        styles=[member.value for member in StyleEnum],
        lightings=[member.value for member in LightingEnum],
        colors_and_tones=[member.value for member in ColorAndToneEnum],
        composition=[member.value for member in CompositionEnum],
        numbers_of_images=[1, 2, 3, 4],
    )

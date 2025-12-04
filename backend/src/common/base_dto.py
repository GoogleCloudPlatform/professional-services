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

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class MimeTypeEnum(str, Enum):
    """MIME type for the media."""

    IMAGE_JPEG = "image/jpeg"
    IMAGE_PNG = "image/png"
    VIDEO_MP4 = "video/mp4"
    AUDIO_WAV = "audio/wav"


class GenerationModelEnum(str, Enum):
    """Enum representing the available Imagen generation models."""

    # Image-Specific Models
    IMAGEN_4_001 = "imagen-4.0-generate-001"
    IMAGEN_4_ULTRA = "imagen-4.0-ultra-generate-001"
    IMAGEN_4_ULTRA_PREVIEW = "imagen-4.0-ultra-generate-preview-06-06"
    IMAGEN_4_FAST = "imagen-4.0-fast-generate-001"
    IMAGEN_4_FAST_PREVIEW = "imagen-4.0-fast-generate-preview-06-06"
    IMAGEN_3_001 = "imagen-3.0-generate-001"
    IMAGEN_3_FAST = "imagen-3.0-fast-generate-001"
    IMAGEN_3_002 = "imagen-3.0-generate-002"
    IMAGEGEN_006 = "imagegeneration@006"
    IMAGEGEN_005 = "imagegeneration@005"
    IMAGEGEN_002 = "imagegeneration@002"
    GEMINI_2_5_FLASH_IMAGE_PREVIEW = "gemini-2.5-flash-image-preview"
    GEMINI_3_PRO_IMAGE_PREVIEW = "gemini-3-pro-image-preview"
    GEMINI_2_5_PRO = "gemini-2.5-pro"
    GEMINI_2_5_FLASH = "gemini-2.5-flash"
    VTO = "virtual-try-on-preview-08-04"

    # Video-Specific Models
    VEO_3_1_PREVIEW = "veo-3.1-generate-preview"
    VEO_3_FAST = "veo-3.0-fast-generate-001"
    VEO_3_QUALITY = "veo-3.0-generate-001"
    VEO_3_FAST_PREVIEW = "veo-3.0-fast-generate-preview"
    VEO_3_QUALITY_PREVIEW = "veo-3.0-generate-preview"
    VEO_2_FAST = "veo-2.0-generate-001"
    VEO_2_QUALITY = "veo-2.0-fast-generate-001"
    VEO_2_GENERATE_EXP = "veo-2.0-generate-exp"

    # Audio-Specific Models
    LYRIA_002 = "lyria-002"
    CHIRP_3 = "chirp_3"
    GEMINI_2_5_FLASH_TTS = "gemini-2.5-flash-tts"
    GEMINI_2_5_FLASH_LITE_PREVIEW_TTS = "gemini-2.5-flash-lite-preview-tts"
    GEMINI_2_5_PRO_TTS = "gemini-2.5-pro-tts"


class AspectRatioEnum(str, Enum):
    """Enum representing the supported aspect ratios."""

    # Common Ratios
    RATIO_9_16 = "9:16"
    RATIO_16_9 = "16:9"

    # Image-Specific Ratios
    RATIO_1_1 = "1:1"
    RATIO_3_4 = "3:4"
    RATIO_4_3 = "4:3"
    RATIO_2_3 = "2:3"
    RATIO_3_2 = "3:2"
    RATIO_4_5 = "4:5"
    RATIO_5_4 = "5:4"
    RATIO_21_9 = "21:9"


class StyleEnum(str, Enum):
    """Enum representing the supported image styles."""

    MODERN = "Modern"
    REALISTIC = "Realistic"
    VINTAGE = "Vintage"
    MONOCHROME = "Monochrome"
    FANTASY = "Fantasy"
    SKETCH = "Sketch"
    PHOTOREALISTIC = "Photorealistic"
    CINEMATIC = "Cinematic"


class ColorAndToneEnum(str, Enum):
    """Enum for color and tone styles."""

    BLACK_AND_WHITE = "Black & White"
    GOLDEN = "Golden"
    MONOCHROMATIC = "Monochromatic"
    MUTED = "Muted"
    PASTEL = "Pastel"
    TONED = "Toned"
    VIBRANT = "Vibrant"
    WARM = "Warm"
    COOL = "Cool"
    MONOCHROME = "Monochrome"


class LightingEnum(str, Enum):
    """Enum for lighting styles."""

    BACKLIGHTING = "Backlighting"
    DRAMATIC_LIGHT = "Dramatic Light"
    GOLDEN_HOUR = "Golden Hour"
    EXPOSURE = "Exposure"
    LOW_LIGHTING = "Low Lighting"
    MULTIEXPOSURE = "Multiexposure"
    STUDIO_LIGHT = "Studio Light"
    CINEMATIC = "Cinematic"
    STUDIO = "Studio"
    NATURAL = "Natural"
    DRAMATIC = "Dramatic"
    AMBIENT = "Ambient"


class CompositionEnum(str, Enum):
    """Enum for image composition styles."""

    CLOSEUP = "Closeup"
    KNOLLING = "Knolling"
    LANDSCAPE_PHOTOGRAPHY = "Landscape photography"
    THROUGH_WINDOW = "Photographed through window"
    SHALLOW_DEPTH_OF_FIELD = "Shallow depth of field"
    SHOT_FROM_ABOVE = "Shot from above"
    SHOT_FROM_BELOW = "Shot from below"
    SURFACE_DETAIL = "Surface detail"
    WIDE_ANGLE = "Wide angle"


class ReferenceImageTypeEnum(str, Enum):
    ASSET = "ASSET"
    STYLE = "STYLE"


class BaseDto(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        extra="forbid",
        populate_by_name=True,
        from_attributes=True,
    )

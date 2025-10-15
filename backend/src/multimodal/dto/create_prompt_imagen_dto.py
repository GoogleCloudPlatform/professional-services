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

from typing import List, Optional

from pydantic import BaseModel, Field
from typing_extensions import Annotated


class ImageMetadata(BaseModel):
    """High-level administrative data for the image prompt."""

    prompt_name: Annotated[
        str, Field(description="A descriptive name for your image concept.")
    ]
    version: float = Field(
        default=1.0, description="Version of the prompt structure."
    )
    target_model: str = Field(
        default="Imagen",
        description="The target image generation model (e.g., Imagen 3, Imagen 4).",
    )
    core_concept: Annotated[
        str,
        Field(description="A one or two-sentence summary of the entire image."),
    ]


class SubjectAndScene(BaseModel):
    """Defines the 'what' and 'where' of the image."""

    main_subject: Annotated[
        str,
        Field(
            description="The primary character, object, or focus. E.g., 'A golden retriever puppy', 'A vintage sports car'."
        ),
    ]
    subject_details: Optional[str] = Field(
        default=None,
        description="Key features, clothing, or expression if the subject is a character. E.g., 'wearing a tiny red bowtie'.",
    )
    environment: Annotated[
        str,
        Field(
            description="Describe the overall setting or background. E.g., 'sitting in a sunlit meadow', 'on a rain-slicked neon street'."
        ),
    ]
    mood_and_atmosphere: Annotated[
        str,
        Field(
            description="Comma-separated keywords describing the feeling. E.g., 'Joyful, vibrant, warm', 'Mysterious, noir, tense'."
        ),
    ]


class VisualStyle(BaseModel):
    """Defines the overall artistic and visual style of the image."""

    aesthetic: Optional[str] = Field(
        default=None,
        description="The primary artistic style. E.g., 'Photorealistic', 'Cinematic', 'Studio photography', 'Fantasy art'.",
    )
    color_palette: Optional[str] = Field(
        default=None,
        description="Describe the dominant colors. E.g., 'Warm autumn colors', 'Cool blues and muted grays'.",
    )
    artistic_influences: Optional[str] = Field(
        default=None,
        description="Optional artists or movements to draw inspiration from. E.g., 'in the style of Ansel Adams', 'reminiscent of impressionist paintings'.",
    )


class PhotographyDirectives(BaseModel):
    """Specifies the technical cinematography and lighting details."""

    shot_type: Annotated[
        str,
        Field(
            description="The camera shot framing. E.g., 'Extreme close-up', 'Wide shot', 'Aerial view'."
        ),
    ]
    lighting_style: Annotated[
        str,
        Field(
            description="Describe the lighting setup. E.g., 'Golden hour backlighting', 'Dramatic three-point studio lighting'."
        ),
    ]
    aspect_ratio: Annotated[
        str,
        Field(
            default="1:1",
            description="The aspect ratio of the final image, e.g., '16:9', '1:1', '4:3'.",
        ),
    ]
    composition: Optional[str] = Field(
        default=None,
        description="Compositional rules. E.g., 'Rule of thirds', 'Symmetrical', 'Leading lines'.",
    )
    lens_and_effects: Optional[str] = Field(
        default=None,
        description="Lens choice and optical effects. E.g., 'Shot with a macro lens with a shallow depth of field', 'Anamorphic lens flare'.",
    )


class Constraints(BaseModel):
    """Specifies what to explicitly exclude from the generation."""

    negative_prompts: List[str] = Field(
        default_factory=list,
        description="List of elements, styles, or colors to explicitly avoid. E.g., ['blurry', 'text', 'watermarks'].",
    )


class CreatePromptImageDto(BaseModel):
    """The structured request model for generating a high-quality image with Imagen."""

    metadata: ImageMetadata
    subject_and_scene: SubjectAndScene
    visual_style: Optional[VisualStyle]
    photography_directives: PhotographyDirectives
    constraints: Constraints

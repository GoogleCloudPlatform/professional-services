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
from pydantic import BaseModel, Field, field_validator
from typing_extensions import Annotated


class Metadata(BaseModel):
    """High-level administrative data for the prompt."""

    prompt_name: Annotated[
        str, Field(description="A descriptive name for your video project.")
    ]
    version: float = Field(
        default=1.0, description="Version of the prompt structure."
    )
    target_model: str = Field(
        default="Veo", description="The target video generation model."
    )
    core_concept: Annotated[
        str,
        Field(description="A one or two-sentence summary of the entire video."),
    ]


class SceneSetup(BaseModel):
    """Defines the setting, mood, and temporal context of the scene."""

    environment: Annotated[
        str,
        Field(
            description="Describe the overall setting, e.g., 'A futuristic cityscape at night'."
        ),
    ]
    mood: Annotated[
        str,
        Field(
            description="Comma-separated list of keywords describing the feeling, e.g., 'Cyberpunk, noir, tense'."
        ),
    ]
    key_objects: List[str] = Field(
        default_factory=list,
        description="Crucial objects present in the scene.",
    )
    temporal_elements: str = Field(
        default="Modern day, daytime",
        description="Describes time of day, season, or time-related effects. E.g., 'Golden hour at sunset', 'Hyper-lapse of city traffic'.",
    )


class Subject(BaseModel):
    """Describes the main 'who' or 'what' of the video."""

    main_subject: Annotated[
        str,
        Field(
            description="The primary character, object, or focus of the video. E.g., 'A golden retriever puppy', 'A vintage sports car'."
        ),
    ]
    character_details: Optional[str] = Field(
        default=None,
        description="Personality, appearance, or specific features if the subject is a character.",
    )
    key_objects: List[str] = Field(
        default_factory=list,
        description="Other crucial objects that are part of the subject or interact with it.",
    )


class VisualStyle(BaseModel):
    """Defines the overall artistic and visual style of the media."""

    aesthetic: Annotated[
        str,
        Field(
            description="Comma-separated list of visual keywords, e.g., 'Cinematic, hyper-realistic'."
        ),
    ]
    color_palette: Annotated[
        str,
        Field(
            description="Describe the dominant colors or lighting, e.g., 'Neon blues and deep blacks'."
        ),
    ]
    resolution_and_format: str = Field(
        default="4K, 16:9 widescreen",
        description="Target resolution and aspect ratio.",
    )


class CameraDirectives(BaseModel):
    """Specifies the technical cinematography details, including camera angles, movements, and lens effects."""

    camera_angles: Annotated[
        List[str],
        Field(
            description="List of desired camera angles. E.g., ['low-angle', 'top-down', 'dutch angle']."
        ),
    ]
    camera_movements: Annotated[
        List[str],
        Field(
            description="List of camera movements. E.g., ['static shot', 'slow dolly-in', 'crane shot', 'slow motion']."
        ),
    ]
    lens_and_optical_effects: Optional[str] = Field(
        default=None,
        description="Describes lens choice and effects. E.g., '85mm macro lens with a shallow depth of field', 'Anamorphic lens flare'.",
    )


class TimelineEvent(BaseModel):
    """Represents a single, sequential event in the video's timeline."""

    sequence_id: Annotated[
        int, Field(description="The order of this event in the timeline.")
    ]
    timestamp: Annotated[
        str,
        Field(description="Time range for this event, e.g., '00:00-00:02'."),
    ]
    action: Annotated[
        str,
        Field(
            description="A clear description of the visual action happening."
        ),
    ]
    camera_instruction: str = Field(
        default="", description="Specific camera movement for this sequence."
    )


class AudioDesign(BaseModel):
    """Describes the overall soundscape of the video."""

    music_style: Optional[str] = Field(
        default=None,
        description="Style of background music. E.g., 'Epic orchestral score', 'Minimalist ambient synth'.",
    )
    key_sound_effects: Optional[str] = Field(
        default=None,
        description="Important SFX. E.g., 'The crisp sound of footsteps on gravel', 'Magical chimes'.",
    )
    dialogue_or_narration: Optional[str] = Field(
        default=None,
        description="Description of any spoken words. E.g., 'Calm, female narrator', 'No dialogue'.",
    )
    audio_description: str = Field(
        default="",
        description="Describe the corresponding sounds for this sequence.",
    )


class Constraints(BaseModel):
    """Specifies what to explicitly exclude from the generation."""

    negative_prompts: List[str] = Field(
        default_factory=list,
        description="List of elements to explicitly avoid.",
    )


class CreatePromptVideoDto(BaseModel):
    """The structured request model for generating a video with Imagen."""

    metadata: Metadata
    subject: Subject
    scene_setup: SceneSetup
    visual_style: VisualStyle
    camera_directives: CameraDirectives
    audio: AudioDesign
    timeline: Annotated[List[TimelineEvent], Field(min_length=1)]
    constraints: Constraints
    final_summary_prompt: Annotated[
        str,
        Field(
            description="A condensed paragraph combining all key elements. Serves as a summary for the AI."
        ),
    ]

    @field_validator("timeline")
    def timeline_must_be_ordered(
        cls, value: List[TimelineEvent]
    ) -> List[TimelineEvent]:
        """Ensures that timeline events are provided in a correct, sequential order."""
        ids = [event.sequence_id for event in value]
        if sorted(ids) != list(range(1, len(ids) + 1)):
            raise ValueError(
                "Timeline sequence_id values must be unique and sequential, starting from 1."
            )
        return value

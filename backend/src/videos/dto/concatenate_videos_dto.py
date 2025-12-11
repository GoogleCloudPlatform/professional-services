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

from typing import List, Literal

from pydantic import BaseModel, Field, model_validator

from src.common.base_dto import AspectRatioEnum, BaseDto


class ConcatenationInput(BaseModel):
    """Defines a single item to be included in the concatenation, preserving order."""

    id: int = Field(description="The ID of the asset or media item.")
    type: Literal["media_item", "source_asset"] = Field(
        description="The type of the input."
    )


class ConcatenateVideosDto(BaseDto):
    """Data Transfer Object for a video concatenation request."""

    name: str = Field(
        min_length=1,
        description="A name for the new concatenated video.",
        default="Concatenated Video",
    )
    workspace_id: int = Field(
        ge=1, description="The ID of the workspace for this generation."
    )
    inputs: List[ConcatenationInput] = Field(
        min_length=2,
        description="An ordered list of videos to concatenate.",
    )
    aspect_ratio: AspectRatioEnum = Field(
        default=AspectRatioEnum.RATIO_16_9,
        description="Aspect ratio of the image.",
    )

    @model_validator(mode="after")
    def validate_inputs(self) -> "ConcatenateVideosDto":
        """Ensures at least two total video inputs are provided."""
        if len(self.inputs) < 2:
            raise ValueError(
                "Concatenation requires at least two video inputs."
            )
        return self

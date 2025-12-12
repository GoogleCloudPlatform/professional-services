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

from typing import Optional

from pydantic import Field, model_validator

from src.common.base_dto import BaseDto


class VtoSourceMediaItemLink(BaseDto):
    """A link to a previously generated media item to be used as a VTO input."""

    media_item_id: int = Field(
        description="The ID of the source MediaItemModel."
    )
    media_index: int = Field(
        description="The index of the image within the parent's `gcs_uris` list."
    )


class VtoInputLink(BaseDto):
    """
    A flexible link that can point to either an uploaded source asset
    or a previously generated media item.
    """

    source_asset_id: Optional[int] = Field(
        default=None, description="The ID of the source asset to use."
    )
    source_media_item: Optional[VtoSourceMediaItemLink] = Field(
        default=None,
        description="The previously generated media item to use.",
    )

    @model_validator(mode="after")
    def check_one_of(self) -> "VtoInputLink":
        """Ensures that exactly one of the input types is provided."""
        if (self.source_asset_id and self.source_media_item) or (
            not self.source_asset_id and not self.source_media_item
        ):
            raise ValueError(
                "Exactly one of 'source_asset_id' or 'source_media_item' must be provided for each input."
            )
        return self


class VtoDto(BaseDto):
    """Request schema for Virtual Try-On image generation."""

    workspace_id: int = Field(
        ge=1, description="The ID of the workspace for this generation."
    )
    number_of_media: int = Field(
        default=1,
        ge=1,
        le=4,
        description="Number of images to generate (between 1 and 4).",
    )
    person_image: VtoInputLink = Field(
        description="The input image of the person for try-on."
    )
    top_image: Optional[VtoInputLink] = Field(
        default=None, description="The input for the top clothing item."
    )
    bottom_image: Optional[VtoInputLink] = Field(
        default=None, description="The input for the bottom clothing item."
    )
    dress_image: Optional[VtoInputLink] = Field(
        default=None, description="The input for the dress."
    )
    shoe_image: Optional[VtoInputLink] = Field(
        default=None, description="The input for the shoes."
    )

    @model_validator(mode="after")
    def check_at_least_one_garment(self) -> "VtoDto":
        """Ensures that at least one garment is provided for the try-on."""
        if not any(
            [
                self.top_image,
                self.bottom_image,
                self.dress_image,
                self.shoe_image,
            ]
        ):
            raise ValueError(
                "At least one garment (top, bottom, dress, or shoe) must be provided for Virtual Try-On."
            )
        return self

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


from pydantic import Field
from google.genai import types

from src.images.dto.create_imagen_dto import CreateImagenDto


class EditImagenDto(CreateImagenDto):
    """
    The refactored request model. Defaults are defined here to make the API
    contract explicit and self-documenting.
    """

    user_image: bytes
    edit_mode: types.EditMode = Field(
        default=types.EditMode.EDIT_MODE_DEFAULT,
        description="Edit Mode used for image editing.",
    )
    mask_mode: types.MaskReferenceMode = Field(
        default=types.MaskReferenceMode.MASK_MODE_DEFAULT,
        description="""Prompts the model to generate a mask instead of you needing to
      provide one (unless MASK_MODE_USER_PROVIDED is used).""",
    )
    include_rai_reason: bool = Field(
        default=True,
        description="""Whether to include the Responsible AI filter reason if the image
      is filtered out of the response.""",
    )
    mask_distilation: float = Field(
        default=0.005,
        description="Dilation percentage of the mask provided. Float between 0 and 1.",
    )

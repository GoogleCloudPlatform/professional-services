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
from typing_extensions import Annotated

from src.common.base_dto import BaseDto
from src.multimodal.gemini_service import PromptTargetEnum


class RewritePromptRequestDto(BaseDto):
    """Request body for the /rewrite-prompt endpoint."""

    target_type: Annotated[
        PromptTargetEnum,
        Field(
            description="The target media type to tailor the prompt for (e.g., 'image' or 'video')."
        ),
    ]
    user_prompt: Annotated[
        str,
        Field(
            description="The simple, user-provided prompt to be rewritten and enhanced.",
            min_length=5,
        ),
    ]


class RandomPromptRequestDto(BaseDto):
    """Request body for the /random-prompt endpoint."""

    target_type: Annotated[
        PromptTargetEnum,
        Field(
            description="The target media type for which to generate a random prompt."
        ),
    ]


class RewrittenOrRandomPromptResponse(BaseDto):
    prompt: str

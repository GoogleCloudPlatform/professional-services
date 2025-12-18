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

from pydantic import Field

from src.common.base_dto import GenerationModelEnum, MimeTypeEnum
from src.common.dto.base_search_dto import BaseSearchDto
from src.common.schema.media_item_model import JobStatusEnum
from src.galleries.dto.gallery_response_dto import MediaItemResponse


class GallerySearchDto(BaseSearchDto):
    user_email: Optional[str] = None
    mime_type: Optional[MimeTypeEnum] = None
    model: Optional[GenerationModelEnum] = None
    status: Optional[JobStatusEnum] = None
    workspace_id: int = Field(
        ge=1, description="The ID of the workspace to search within."
    )

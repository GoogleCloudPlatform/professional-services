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

from src.common.base_dto import BaseDto


class CustomImagenResult(BaseDto):
    gcs_uri: Optional[str]
    mime_type: str
    encoded_image: str
    presigned_url: str


class ImageGenerationResult(BaseDto):
    enhanced_prompt: Optional[str]
    rai_filtered_reason: Optional[str]
    image: CustomImagenResult

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

from src.common.base_dto import BaseDto


class GenerateUploadUrlDto(BaseDto):
    """Request body to generate a signed URL for upload."""
    filename: str = Field(description="The name of the file to be uploaded.")
    content_type: str = Field(description="The MIME type of the file (e.g., 'application/pdf').")
    size: int = Field(gt=0, description="The size of the file in bytes.")
    workspace_id: int = Field(description="The target workspace ID.")

class GenerateUploadUrlResponseDto(BaseDto):
    """Response containing the signed URL and the final GCS URI."""
    upload_url: str = Field(description="The GCS v4 signed URL for the PUT/POST request.")
    gcs_uri: str = Field(description="The gs:// path where the file will be stored.")

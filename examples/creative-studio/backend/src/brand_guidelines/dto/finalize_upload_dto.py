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

from pydantic import BaseModel, Field


class FinalizeUploadDto(BaseModel):
    """Request body to finalize an upload and start processing."""
    name: str = Field(min_length=3, max_length=100, description="The name for the new brand guideline.")
    workspace_id: Optional[int] = Field(None, description="The ID of the workspace to associate the guideline with.")
    gcs_uri: str = Field(description="The GCS URI of the successfully uploaded PDF file.")
    original_filename: str = Field(description="The original name of the uploaded file.")

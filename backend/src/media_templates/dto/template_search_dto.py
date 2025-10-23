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

from typing import Optional, List
from pydantic import BaseModel, Field
from src.media_templates.schema.media_template_model import (
    IndustryEnum,
    MimeTypeEnum,
)


class TemplateSearchDto(BaseModel):
    """Defines the searchable and filterable fields for the template gallery."""

    # Pagination fields
    limit: int = Field(default=20, ge=1, le=100)
    start_after: Optional[str] = Field(
        default=None,
        description="The document ID to start the query after for pagination.",
    )

    # Filtering fields based on MediaTemplateModel
    industry: Optional[IndustryEnum] = None
    brand: Optional[str] = None
    mime_type: Optional[MimeTypeEnum] = None
    # For tags, we'll likely search one at a time
    tag: Optional[str] = Field(
        default=None, description="A single tag to filter by."
    )

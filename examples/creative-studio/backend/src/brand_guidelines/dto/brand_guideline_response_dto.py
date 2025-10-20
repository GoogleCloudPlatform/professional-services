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

from typing import List

from pydantic import Field

from src.brand_guidelines.schema.brand_guideline_model import (
    BrandGuidelineModel,
)


class BrandGuidelineResponseDto(BrandGuidelineModel):
    """Response DTO for a brand guideline, including presigned URLs."""

    presigned_source_pdf_urls: List[str] = Field(
        default_factory=list,
        description="Presigned URLs for the source PDF chunks.",
    )

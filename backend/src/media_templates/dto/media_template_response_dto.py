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

from typing import List, Optional

from src.galleries.dto.gallery_response_dto import (
    SourceAssetLinkResponse,
    SourceMediaItemLinkResponse,
)
from src.media_templates.schema.media_template_model import MediaTemplateModel


class MediaTemplateResponse(MediaTemplateModel):
    """
    The response model for a gallery item.
    It includes all fields from the original MediaItem plus a list of
    temporary, presigned URLs for frontend display.
    """

    presigned_urls: List[str] = []
    presigned_thumbnail_urls: List[str] = []
    enriched_source_assets: Optional[List[SourceAssetLinkResponse]] = []

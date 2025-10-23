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

from src.common.schema.media_item_model import (
    MediaItemModel,
    SourceAssetLink,
    SourceMediaItemLink,
)


class SourceAssetLinkResponse(SourceAssetLink):
    """
    Extends the source asset link with a presigned URL and GCS URI for frontend display.
    """

    presigned_url: str
    gcs_uri: str
    presigned_thumbnail_url: Optional[str] = None


class SourceMediaItemLinkResponse(SourceMediaItemLink):
    """
    Extends the source media item link with a presigned URL and GCS URI for frontend display.
    """

    presigned_url: str
    gcs_uri: str
    presigned_thumbnail_url: Optional[str] = None


class MediaItemResponse(MediaItemModel):
    """
    The response model for a gallery item.
    It includes all fields from the original MediaItem plus a list of
    temporary, presigned URLs for frontend display.
    """

    presigned_urls: List[str] = []
    presigned_thumbnail_urls: Optional[List[str]] = []
    enriched_source_assets: Optional[List[SourceAssetLinkResponse]] = None
    enriched_source_media_items: Optional[List[SourceMediaItemLinkResponse]] = (
        None
    )

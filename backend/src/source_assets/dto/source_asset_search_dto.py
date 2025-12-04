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
from src.source_assets.schema.source_asset_model import (
    AssetScopeEnum,
    AssetTypeEnum,
)


class SourceAssetSearchDto(BaseDto):
    """
    Defines the query parameters for paginated search of user assets.
    """

    limit: int = 20
    start_after: Optional[str] = None  # The document ID to start after
    mime_type: Optional[str] = None

    # This fields will ONLY be used if the requester is an ADMIN
    user_email: Optional[str] = None
    scope: Optional[AssetScopeEnum] = None
    asset_type: Optional[AssetTypeEnum] = None
    original_filename: Optional[str] = None

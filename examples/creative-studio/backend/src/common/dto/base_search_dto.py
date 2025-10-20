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

from src.common.base_dto import BaseDto


class BaseSearchDto(BaseDto):
    """
    A base DTO for paginated search queries.
    Provides common fields for limit and cursor-based pagination.
    """

    limit: int = Field(
        default=12,
        ge=1,
        le=100,
        description="Number of items to return per page.",
    )

    # The cursor is the ID of the last document from the previous page.
    # It's optional because the first request will not have a cursor.
    start_after: Optional[str] = Field(
        default=None,
        description="The document ID to start the query after for pagination.",
    )

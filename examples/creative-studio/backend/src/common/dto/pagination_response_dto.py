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

from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

from src.common.base_dto import BaseDto

# This TypeVar is used to declare the type of data the paginated response will hold.
T = TypeVar("T")


class PaginationResponseDto(BaseDto, Generic[T]):
    """
    A generic DTO for sending paginated data to the client.
    It includes the data for the current page, the total count of items,
    and a cursor to fetch the next page.
    """

    data: Optional[List[T]] = Field(
        description="The list of documents for the current page."
    )
    count: int = Field(
        description="Total number of documents matching the query."
    )
    page: int = Field(
        description="Current page number (1-indexed)."
    )
    page_size: int = Field(
        description="Number of items per page."
    )
    total_pages: int = Field(
        description="Total number of pages."
    )

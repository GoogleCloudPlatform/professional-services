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

from fastapi import Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.brand_guidelines.dto.brand_guideline_search_dto import (
    BrandGuidelineSearchDto,
)
from src.brand_guidelines.schema.brand_guideline_model import (
    BrandGuideline,
    BrandGuidelineModel,
)
from src.common.base_repository import BaseRepository
from src.common.dto.pagination_response_dto import PaginationResponseDto
from src.database import get_db


class BrandGuidelineRepository(BaseRepository[BrandGuideline, BrandGuidelineModel]):
    """
    Repository for all database operations related to the 'brand_guidelines' table.
    """

    def __init__(self, db: AsyncSession = Depends(get_db)):
        """Initializes the repository."""
        super().__init__(model=BrandGuideline, schema=BrandGuidelineModel, db=db)

    async def query(
        self,
        search_dto: BrandGuidelineSearchDto,
        workspace_id: Optional[int] = None,
    ) -> PaginationResponseDto[BrandGuidelineModel]:
        """
        Performs a generic, paginated query on the brand_guidelines table.
        """
        query = select(self.model)

        # Apply filters
        # Assuming search_dto has fields like name, etc.
        # If workspace_id is provided, filter by it
        if workspace_id is not None:
            query = query.where(self.model.workspace_id == workspace_id)

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total_count = count_result.scalar_one()

        # Order and Pagination
        query = query.order_by(self.model.created_at.desc())
        query = query.offset(search_dto.offset).limit(search_dto.limit)

        # Execute
        result = await self.db.execute(query)
        guidelines = result.scalars().all()
        
        guideline_data = [
            self.schema.model_validate(g) for g in guidelines
        ]

        # Calculate pagination metadata
        page = (search_dto.offset // search_dto.limit) + 1
        page_size = search_dto.limit
        total_pages = (total_count + page_size - 1) // page_size

        return PaginationResponseDto[BrandGuidelineModel](
            count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            data=guideline_data,
        )

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

from fastapi import Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.common.base_repository import BaseRepository
from src.common.dto.pagination_response_dto import PaginationResponseDto
from src.database import get_db
from src.media_templates.dto.template_search_dto import TemplateSearchDto
from src.media_templates.schema.media_template_model import (
    MediaTemplate,
    MediaTemplateModel,
)
from typing import Optional


class MediaTemplateRepository(BaseRepository[MediaTemplate, MediaTemplateModel]):
    """Handles all database operations for MediaTemplate objects."""

    def __init__(self, db: AsyncSession = Depends(get_db)):
        """Initializes the repository."""
        super().__init__(model=MediaTemplate, schema=MediaTemplateModel, db=db)

    async def query(
        self, search_dto: TemplateSearchDto
    ) -> PaginationResponseDto[MediaTemplateModel]:
        """
        Performs a powerful, paginated query on the media_templates table.
        """
        query = select(self.model)

        if search_dto.industry:
            query = query.where(self.model.industry == search_dto.industry.value)
        
        if search_dto.brand:
            query = query.where(self.model.brand == search_dto.brand)
        
        if search_dto.mime_type:
            query = query.where(self.model.mime_type == search_dto.mime_type.value)
        
        if search_dto.tag:
            # Postgres ARRAY contains check
            query = query.where(self.model.tags.contains([search_dto.tag]))

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total_count = count_result.scalar_one()

        # Order and Pagination
        query = query.order_by(self.model.created_at.desc())
        query = query.limit(search_dto.limit)

        # Execute
        result = await self.db.execute(query)
        templates = result.scalars().all()
        
        template_data = [
            self.schema.model_validate(t) for t in templates
        ]

        # Calculate pagination metadata
        page = (search_dto.limit > 0) and ((search_dto.offset // search_dto.limit) + 1) or 1
        page_size = search_dto.limit
        total_pages = (search_dto.limit > 0) and ((total_count + page_size - 1) // page_size) or 0

        return PaginationResponseDto[MediaTemplateModel](
            count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            data=template_data,
        )

    async def get_by_name(self, name: str) -> Optional[MediaTemplateModel]:
        """Finds a template by its name."""
        result = await self.db.execute(
            select(self.model).where(self.model.name == name).limit(1)
        )
        template = result.scalar_one_or_none()
        if not template:
            return None
        return self.schema.model_validate(template)

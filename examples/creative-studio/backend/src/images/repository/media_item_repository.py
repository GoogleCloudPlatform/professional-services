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

from src.common.base_repository import BaseRepository
from src.common.dto.pagination_response_dto import PaginationResponseDto
from src.common.schema.media_item_model import MediaItem, MediaItemModel
from src.database import get_db
from src.galleries.dto.gallery_search_dto import GallerySearchDto


class MediaRepository(BaseRepository[MediaItem, MediaItemModel]):
    """Handles database operations for MediaItem objects."""

    def __init__(self, db: AsyncSession = Depends(get_db)):
        super().__init__(model=MediaItem, schema=MediaItemModel, db=db)

    async def query(
        self,
        search_dto: GallerySearchDto,
        workspace_id: Optional[int] = None,
    ) -> PaginationResponseDto[MediaItemModel]:
        """
        Performs a generic, paginated query on the media_library table.
        """
        query = select(self.model)

        if search_dto.user_email:
            query = query.where(self.model.user_email == search_dto.user_email)
        
        if search_dto.mime_type:
            query = query.where(self.model.mime_type == search_dto.mime_type.value)
        
        if search_dto.model:
            query = query.where(self.model.model == search_dto.model.value)
        
        if search_dto.status:
            query = query.where(self.model.status == search_dto.status.value)
            
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
        items = result.scalars().all()
        
        media_item_data = [
            self.schema.model_validate(item) for item in items
        ]

        # Calculate pagination metadata
        page = (search_dto.offset // search_dto.limit) + 1
        page_size = search_dto.limit
        total_pages = (total_count + page_size - 1) // page_size

        return PaginationResponseDto[MediaItemModel](
            count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            data=media_item_data,
        )

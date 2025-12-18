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
from src.database import get_db
from src.users.dto.user_search_dto import UserSearchDto
from src.users.user_model import User, UserModel


class UserRepository(BaseRepository[User, UserModel]):
    """
    Handles all database operations for the User table.
    """

    def __init__(self, db: AsyncSession = Depends(get_db)):
        super().__init__(model=User, schema=UserModel, db=db)

    async def get_by_email(self, email: str) -> Optional[UserModel]:
        """
        Finds a single user by their email address.
        """
        result = await self.db.execute(
            select(self.model).where(self.model.email == email)
        )
        user = result.scalar_one_or_none()
        if not user:
            return None
        return self.schema.model_validate(user)

    async def query(
        self, search_dto: UserSearchDto
    ) -> PaginationResponseDto[UserModel]:
        """
        Performs a paginated query that includes the total document count.
        """
        # 1. Build the base query
        query = select(self.model)
        
        if search_dto.email:
            query = query.where(self.model.email == search_dto.email)
        
        if search_dto.role:
            # Postgres ARRAY contains check
            query = query.where(self.model.roles.contains([search_dto.role.value]))

        # 2. Get total count
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total_count = count_result.scalar_one()

        # 3. Add ordering and pagination
        # Default ordering by created_at DESC
        query = query.order_by(self.model.created_at.desc())

        # Offset-based pagination
        query = query.offset(search_dto.offset).limit(search_dto.limit)

        # 4. Execute
        result = await self.db.execute(query)
        users = result.scalars().all()
        
        user_data = [self.schema.model_validate(user) for user in users]

        # 5. Determine next cursor (offset)
        # Calculate pagination metadata
        page = (search_dto.offset // search_dto.limit) + 1
        page_size = search_dto.limit
        total_pages = (total_count + page_size - 1) // page_size

        return PaginationResponseDto[UserModel](
            count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            data=user_data,
        )

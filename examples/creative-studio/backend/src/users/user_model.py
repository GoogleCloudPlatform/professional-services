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

import datetime
from enum import Enum
from typing import List, Optional

from pydantic import Field, field_validator
from sqlalchemy import String, func, DateTime
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from src.common.base_repository import BaseDocument
from src.database import Base


class UserRoleEnum(str, Enum):
    """
    Defines the distinct roles a user can have within the application,
    enabling role-based access control.
    """

    USER = "user"  # Basic access to browse and use public features.
    CREATOR = "creator"  # Can create and manage their own content.
    ADMIN = "admin"  # Has full administrative privileges, including user management.


class User(Base):
    """
    SQLAlchemy model for the 'users' table.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    roles: Mapped[List[str]] = mapped_column(ARRAY(String), default=[])
    name: Mapped[str] = mapped_column(String, default="")
    picture: Mapped[str] = mapped_column(String, default="")
    
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        insert_default=func.now(),
        server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        insert_default=func.now(),
        onupdate=func.now(),
        server_default=func.now()
    )


class UserModel(BaseDocument):
    """
    Represents a user document (DTO) for the API.
    """

    # ID is required for Read DTOs
    id: int
    email: str
    roles: List[UserRoleEnum] = Field(default_factory=list)
    name: str
    picture: str = ""

    @field_validator("roles", mode="after")
    @classmethod
    def default_to_user_role(
        cls, roles: List[UserRoleEnum]
    ) -> List[UserRoleEnum]:
        """
        Ensures that if the 'roles' list is empty after initialization,
        it defaults to containing the 'USER' role.
        """
        if not roles:
            return [UserRoleEnum.USER]
        return roles

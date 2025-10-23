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

from enum import Enum
from typing import List

from pydantic import Field, field_validator

from src.common.base_repository import BaseDocument


class UserRoleEnum(str, Enum):
    """
    Defines the distinct roles a user can have within the application,
    enabling role-based access control.
    """

    USER = "user"  # Basic access to browse and use public features.
    CREATOR = "creator"  # Can create and manage their own content.
    ADMIN = "admin"  # Has full administrative privileges, including user management.


class UserModel(BaseDocument):
    """
    Represents a user document in the Firestore database.
    The document ID for this model should be the Firebase Auth UID.
    """

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

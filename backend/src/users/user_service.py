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

from src.common.dto.pagination_response_dto import PaginationResponseDto
from src.users.dto.user_create_dto import UserUpdateRoleDto
from src.users.dto.user_search_dto import UserSearchDto
from src.users.repository.user_repository import UserRepository
from src.users.user_model import UserModel, UserRoleEnum


class UserService:
    """
    Handles the business logic for user management.
    """

    def __init__(self):
        self.user_repo = UserRepository()

    def create_user_if_not_exists(
        self, email: str, name: str, picture: Optional[str]
    ) -> UserModel:
        """
        Retrieves a user by their UID. If the user exists, it updates their
        last login time. If the user doesn't exist, it creates a new user
        document with the current time as the last login.
        """

        # 1. Check if the user already exists in the database.
        # existing_user = self.user_repo.get_by_id(uid)
        existing_user = self.user_repo.get_by_email(email)

        if existing_user:
            return existing_user

        # 2. If the user does not exist, create a new User model instance
        #    The document ID is the Firebase UID
        new_user = UserModel(
            email=email,
            roles=[
                UserRoleEnum.USER
            ],  # Assign a default role "user" for all new users
            name=name,
            picture=picture or "",  # Ensure picture is a string, not None
        )

        # 3. Call the repository's save() method to create the new document
        self.user_repo.save(new_user)

        return new_user

    def get_user_by_id(self, user_id: str) -> Optional[UserModel]:
        """Finds a single user by their document ID."""
        return self.user_repo.get_by_id(user_id)

    def find_all_users(
        self, search_dto: UserSearchDto
    ) -> PaginationResponseDto[UserModel]:
        """Retrieves a paginated list of all users."""
        return self.user_repo.query(search_dto)

    def update_user_role(
        self, user_id: str, role_data: UserUpdateRoleDto
    ) -> Optional[UserModel]:
        """Updates the role of a specific user."""
        # Convert the list of enums to a list of strings for Firestore
        roles_as_strings = [role.value for role in role_data.roles]

        # The update method in the repository would handle updating the 'role' field
        return self.user_repo.update(user_id, {"roles": roles_as_strings})

    def delete_user_by_id(self, user_id: str) -> bool:
        """Deletes a user from the system."""
        # Note: This should also trigger a deletion in Firebase Authentication
        # which requires the Admin SDK.
        return self.user_repo.delete(user_id)

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

from fastapi import APIRouter, Depends, HTTPException, status

from src.auth.auth_guard import RoleChecker, get_current_user
from src.common.dto.pagination_response_dto import PaginationResponseDto
from src.users.dto.user_create_dto import UserCreateDto, UserUpdateRoleDto
from src.users.dto.user_search_dto import UserSearchDto
from src.users.user_model import UserModel, UserRoleEnum
from src.users.user_service import UserService

# Define role checkers for convenience and clean code
admin_only = Depends(RoleChecker(allowed_roles=[UserRoleEnum.ADMIN]))
any_authenticated_user = Depends(get_current_user)

router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


# You can still have a UserService dependency for other operations if needed.
# However, for getting the current user, the auth dependency is all you need.
@router.get("/me", response_model=UserModel, status_code=status.HTTP_200_OK)
async def get_my_profile(
    # This is the magic. FastAPI runs get_current_user, which authenticates
    # the user and provides their UserData object here.
    current_user: UserModel = Depends(get_current_user),
):
    """
    Retrieves the profile for the currently authenticated user.

    The user's identity is determined from the JWT sent in the Authorization header.
    This endpoint demonstrates how the `get_current_user` dependency injects
    the user's data directly into the endpoint function.
    """
    # The 'current_user' object is the fully validated user model from your database.
    # The controller doesn't need to know about the UID; it already has the whole object.
    return current_user


# --- Admin-Only Endpoints ---
@router.get(
    "",
    response_model=PaginationResponseDto[UserModel],
    summary="List All Users (Admin Only)",
    dependencies=[admin_only],
)
async def list_all_users(
    search_params: UserSearchDto = Depends(),
    user_service: UserService = Depends(),
):
    """
    Retrieves a paginated list of all users in the system.
    This functionality is restricted to administrators.
    """
    return await user_service.find_all_users(search_params)


@router.get(
    "/{user_id}",
    response_model=UserModel,
    summary="Get User by ID (Admin Only)",
    dependencies=[admin_only],
)
async def get_user_by_id(user_id: int, user_service: UserService = Depends()):
    """

    Retrieves a single user's profile by their unique ID.
    This functionality is restricted to administrators.
    """
    user = await user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put(
    "/{user_id}",
    response_model=UserModel,
    summary="Update a User's Role (Admin Only)",
    dependencies=[admin_only],
)
async def update_user_role(
    user_id: int,
    role_data: UserUpdateRoleDto,
    user_service: UserService = Depends(),
):
    """
    Updates the role of a specific user (e.g., promote to 'admin' or 'creator').
    This functionality is restricted to administrators.
    """
    updated_user = await user_service.update_user_role(user_id, role_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a User (Admin Only)",
    dependencies=[admin_only],
)
async def delete_user(user_id: int, user_service: UserService = Depends()):
    """
    Permanently deletes a user from the database.
    This functionality is restricted to administrators.
    """
    if not await user_service.delete_user_by_id(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return

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

from typing import Annotated

from fastapi import Depends, HTTPException, status

from src.auth.auth_guard import get_current_user
from src.users.user_model import UserModel, UserRoleEnum
from src.workspaces.repository.workspace_repository import WorkspaceRepository
from src.workspaces.schema.workspace_model import (
    WorkspaceModel,
    WorkspaceScopeEnum,
)


class WorkspaceAuth:
    """
    A dependency class that centralizes workspace authorization logic.
    """

    def __init__(self):
        self.workspace_repo = WorkspaceRepository()

    def authorize(self, workspace_id: str, user: UserModel) -> WorkspaceModel:
        """
        The core authorization logic. Checks if a user has rights to a workspace.

        Raises HTTPException if unauthorized.
        Returns the WorkspaceModel if authorized.
        """
        workspace = self.workspace_repo.get_by_id(workspace_id)

        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Workspace with ID '{workspace_id}' not found.",
            )

        # Authorization checks
        is_admin = UserRoleEnum.ADMIN in user.roles
        is_public = workspace.scope == WorkspaceScopeEnum.PUBLIC
        is_member = user.id in workspace.member_ids

        # Access is granted if the user is an admin, the workspace is public,
        # or the user is explicitly a member of the private workspace.
        if not (is_admin or is_public or is_member):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this workspace.",
            )

        return workspace


# Create a single instance to be used as a dependency
workspace_auth_service = WorkspaceAuth()

# Create an annotated dependency for cleaner use in endpoint signatures
AuthorizedWorkspace = Annotated[
    WorkspaceModel, Depends(workspace_auth_service.authorize)
]

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

from typing import List, Optional

from fastapi import Depends, HTTPException, status

from src.common.email_service import EmailService
from src.users.repository.user_repository import UserRepository
from src.users.user_model import UserModel, UserRoleEnum
from src.workspaces.dto.create_workspace_dto import CreateWorkspaceDto
from src.workspaces.dto.invite_user_dto import InviteUserDto
from src.workspaces.repository.workspace_repository import WorkspaceRepository
from src.workspaces.schema.workspace_model import (
    WorkspaceMember,
    WorkspaceModel,
    WorkspaceRoleEnum,
)


class WorkspaceService:
    """
    Handles the business logic for workspace management.
    """

    def __init__(
        self,
        workspace_repo: WorkspaceRepository = Depends(),
        user_repo: UserRepository = Depends(),
        email_service: EmailService = Depends(),
    ):
        self.workspace_repo = workspace_repo
        self.user_repo = user_repo
        self.email_service = email_service

    async def create_workspace(
        self, user: UserModel, create_dto: CreateWorkspaceDto
    ) -> WorkspaceModel:
        """Creates a new workspace with the creator as the owner."""
        # 1. Create the owner as the first member of the workspace
        owner_as_member = WorkspaceMember(
            user_id=user.id, email=user.email, role=WorkspaceRoleEnum.OWNER
        )

        # 2. Create the new Workspace model instance
        new_workspace = WorkspaceModel(
            name=create_dto.name,
            owner_id=user.id,
        )
        return await self.workspace_repo.create(new_workspace, initial_members=[owner_as_member])

    async def invite_user_to_workspace(
        self,
        workspace_id: int,
        invite_dto: InviteUserDto,
        current_user: UserModel,
    ) -> Optional[WorkspaceModel]:
        """
        Invites a user to a workspace by adding them to the members list.
        This action is restricted to the workspace owner or a system admin.
        """
        # 1. Authorization Check: Verify the inviting user has permission.

        workspace = await self.workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found.",
            )

        is_system_admin = UserRoleEnum.ADMIN in current_user.roles
        is_workspace_owner = current_user.id == workspace.owner_id

        if not (is_system_admin or is_workspace_owner):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the workspace owner or a system admin can invite users.",
            )

        # 2. Find the user to be invited by their email
        invited_user = await self.user_repo.get_by_email(invite_dto.email)
        if not invited_user:
            return None  # Or raise an exception (e.g., UserNotFound)

        # 3. Add the new member to the workspace document
        new_member = WorkspaceMember(
            user_id=invited_user.id,
            email=invited_user.email,
            role=invite_dto.role,
        )
        updated_workspace = await self.workspace_repo.add_member_to_workspace(
            workspace_id, new_member, invited_user.id
        )

        # 4. Send an invitation email to the user.
        if updated_workspace:
            self.email_service.send_workspace_invitation_email(
                recipient_email=invited_user.email,
                inviter_name=current_user.name,
                workspace_name=updated_workspace.name,
                workspace_id=workspace_id,
            )
        return updated_workspace

    async def list_workspaces_for_user(self, user: UserModel) -> List[WorkspaceModel]:
        """
        Retrieves all workspaces a user has access to. This includes:
        1. All public workspaces.
        2. All private workspaces where the user is a member.
        """
        # 1. Fetch all workspaces where the user is explicitly a member.
        private_workspaces = await self.workspace_repo.find_by_member_id(user.id)

        # 2. Fetch all public workspaces.
        public_workspaces = await self.workspace_repo.get_all_public_workspaces()

        # 3. Combine the lists and remove duplicates.
        # A dictionary is used to ensure uniqueness based on workspace ID.
        all_workspaces_map = {w.id: w for w in private_workspaces}
        for w in public_workspaces:
            all_workspaces_map[w.id] = w

        return list(all_workspaces_map.values())

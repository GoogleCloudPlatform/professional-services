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

from fastapi import Depends
from sqlalchemy import select, exists
from sqlalchemy.ext.asyncio import AsyncSession

from src.common.base_repository import BaseRepository
from src.database import get_db
from src.workspaces.schema.workspace_model import (
    Workspace,
    WorkspaceMember,
    WorkspaceMemberAssociation,
    WorkspaceModel,
    WorkspaceScopeEnum,
)


class WorkspaceRepository(BaseRepository[Workspace, WorkspaceModel]):
    """
    Repository for all database operations related to the 'workspaces' table.
    """

    def __init__(self, db: AsyncSession = Depends(get_db)):
        """Initializes the repository."""
        super().__init__(model=Workspace, schema=WorkspaceModel, db=db)

    async def get_public_workspace(self) -> Optional[WorkspaceModel]:
        """
        Finds the first workspace that is marked as 'public'.
        This is typically used for the main homepage gallery.
        """
        result = await self.db.execute(
            select(self.model)
            .where(self.model.scope == WorkspaceScopeEnum.PUBLIC.value)
            .limit(1)
        )
        workspace = result.scalar_one_or_none()
        if not workspace:
            return None
        return self._map_to_schema(workspace)

    async def get_all_public_workspaces(self) -> List[WorkspaceModel]:
        """Finds all workspaces that are marked as 'public'."""
        result = await self.db.execute(
            select(self.model).where(self.model.scope == WorkspaceScopeEnum.PUBLIC.value)
        )
        workspaces = result.scalars().all()
        return [self._map_to_schema(w) for w in workspaces]

    async def create(
        self, schema: WorkspaceModel, initial_members: List[WorkspaceMember] = []
    ) -> WorkspaceModel:
        """
        Creates a new workspace and handles the members association manually.
        """
        # Convert Pydantic schema to dict
        data = schema.model_dump(exclude_unset=True)
        
        # Remove id if present and None
        if data.get("id") is None:
            data.pop("id", None)
            
        # Create Workspace instance
        db_item = self.model(**data)
        
        # Handle members manually
        for member in initial_members:
            association = WorkspaceMemberAssociation(
                user_id=member.user_id,
                role=member.role
            )
            db_item.members.append(association)

        self.db.add(db_item)
        await self.db.commit()
        await self.db.refresh(db_item)
        
        return self._map_to_schema(db_item)

    async def add_member_to_workspace(
        self, workspace_id: int, member: WorkspaceMember, user_id: int
    ) -> Optional[WorkspaceModel]:
        """
        Atomically adds a new member to a workspace's 'members' list.
        """
        # Fetch the workspace
        result = await self.db.execute(
            select(self.model).where(self.model.id == workspace_id)
        )
        workspace = result.scalar_one_or_none()
        if not workspace:
            return None

        # Check if user is already a member
        # We can check the relationship or query the association table directly.
        # Since we have lazy="selectin", workspace.members should be loaded.
        existing_member = next((m for m in workspace.members if m.user_id == user_id), None)
        
        if not existing_member:
            # Create new association
            new_association = WorkspaceMemberAssociation(
                workspace_id=workspace_id,
                user_id=user_id,
                role=member.role
            )
            workspace.members.append(new_association)
            await self.db.commit()
            await self.db.refresh(workspace)
        
        # We need to map the SQLAlchemy models back to the Pydantic model
        return self._map_to_schema(workspace)

    async def find_by_member_id(self, user_id: int) -> List[WorkspaceModel]:
        """Finds all workspaces where the user is a member."""
        result = await self.db.execute(
            select(self.model)
            .join(WorkspaceMemberAssociation)
            .where(WorkspaceMemberAssociation.user_id == user_id)
        )
        workspaces = result.scalars().all()
        return [self._map_to_schema(w) for w in workspaces]

    async def is_member(self, workspace_id: int, user_id: int) -> bool:
        """Checks if a user is a member of a workspace."""
        result = await self.db.execute(
            select(exists().where(
                WorkspaceMemberAssociation.workspace_id == workspace_id,
                WorkspaceMemberAssociation.user_id == user_id
            ))
        )
        return result.scalar()

    async def get_scope(self, workspace_id: int) -> Optional[str]:
        """Retrieves the scope of a workspace."""
        result = await self.db.execute(
            select(self.model.scope).where(self.model.id == workspace_id)
        )
        return result.scalar_one_or_none()

    def _map_to_schema(self, workspace: Workspace) -> WorkspaceModel:
        """Helper to map SQLAlchemy Workspace to Pydantic WorkspaceModel."""
        # Create the Pydantic model
        workspace_dict = {
            "id": workspace.id,
            "name": workspace.name,
            "owner_id": workspace.owner_id,
            "scope": workspace.scope,
            "created_at": workspace.created_at,
            "updated_at": workspace.updated_at
        }
        
        return self.schema.model_validate(workspace_dict)

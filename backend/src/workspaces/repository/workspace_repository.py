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

from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from src.common.base_repository import BaseRepository
from src.workspaces.schema.workspace_model import (
    WorkspaceMember,
    WorkspaceModel,
    WorkspaceScopeEnum,
)


class WorkspaceRepository(BaseRepository[WorkspaceModel]):
    """
    Repository for all database operations related to the 'workspaces' collection.
    """

    def __init__(self):
        """Initializes the repository with the 'workspaces' collection."""
        super().__init__(collection_name="workspaces", model=WorkspaceModel)

    def get_public_workspace(self) -> Optional[WorkspaceModel]:
        """
        Finds the first workspace that is marked as 'public'.
        This is typically used for the main homepage gallery.
        """
        query = self.collection_ref.where(
            filter=FieldFilter("scope", "==", WorkspaceScopeEnum.PUBLIC.value)
        ).limit(1)
        docs = query.stream()
        for doc in docs:
            data = doc.to_dict()
            return self.model.model_validate({**data, "id": doc.id})
        return None

    def get_all_public_workspaces(self) -> List[WorkspaceModel]:
        """Finds all workspaces that are marked as 'public'."""
        query = self.collection_ref.where(
            filter=FieldFilter("scope", "==", WorkspaceScopeEnum.PUBLIC)
        )
        docs = query.stream()
        return [
            self.model.model_validate({**doc.to_dict(), "id": doc.id})
            for doc in docs
        ]

    def add_member_to_workspace(
        self, workspace_id: str, member: WorkspaceMember, user_id: str
    ) -> Optional[WorkspaceModel]:
        """
        Atomically adds a new member to a workspace's 'members' array and
        the corresponding user ID to the 'member_ids' array for querying.
        """
        workspace_ref = self.collection_ref.document(workspace_id)
        member_dict = member.model_dump(by_alias=True)

        # Perform both updates atomically.
        workspace_ref.update(
            {
                "members": firestore.ArrayUnion([member_dict]),
                "member_ids": firestore.ArrayUnion([user_id]),
            }
        )

        # Fetch the updated document to return the full object
        updated_doc = workspace_ref.get()
        if updated_doc.exists:
            data = updated_doc.to_dict()
            return self.model.model_validate({**data, "id": updated_doc.id})  # type: ignore
        return None

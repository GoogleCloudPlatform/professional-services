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

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from src.common.base_repository import BaseDocument


class WorkspaceRoleEnum(str, Enum):
    """Defines the permissions a user has within a single workspace."""

    VIEWER = "viewer"
    EDITOR = "editor"
    ADMIN = "admin"
    OWNER = "owner"


class WorkspaceScopeEnum(str, Enum):
    """Defines the overall visibility of the workspace in the application."""

    PUBLIC = "public"  # Visible to everyone (e.g., the "Default Google Workspace" gallery)
    PRIVATE = "private"  # Visible only to users listed in the 'members' list.


class WorkspaceMember(BaseModel):
    """
    An embedded sub-document defining a user's role within this workspace.
    This complete list is stored on the workspace document.
    """

    user_id: str = Field(description="The Firebase Auth UID of the member.")
    email: str = Field(
        description="The member's email (denormalized for display)."
    )
    role: WorkspaceRoleEnum = Field(default=WorkspaceRoleEnum.VIEWER)

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class WorkspaceModel(BaseDocument):
    """
    COLLECTION: workspaces (Root-Level Collection)
    Represents a project, team, or folder. Access is controlled by the 'scope'
    and the 'members' list.
    """

    name: str
    owner_id: str = Field(
        description="The user_id of the person who created this workspace."
    )

    scope: WorkspaceScopeEnum = Field(
        default=WorkspaceScopeEnum.PRIVATE,
        description="Public workspaces are visible to all users. Private ones are visible only to members.",
    )

    members: List[WorkspaceMember] = Field(
        default_factory=list,
        description="The complete list of members who have access to this (if private).",
    )

    member_ids: List[str] = Field(
        default_factory=list,
        description="A denormalized list of user IDs for efficient 'array_contains' queries.",
    )

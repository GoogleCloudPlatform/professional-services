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

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel

from src.workspaces.schema.workspace_model import WorkspaceRoleEnum


class InviteUserDto(BaseModel):
    """Data transfer object for inviting a user to a workspace."""

    email: EmailStr
    role: WorkspaceRoleEnum = Field(default=WorkspaceRoleEnum.VIEWER)

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

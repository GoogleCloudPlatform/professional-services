# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import google.auth
from enum import Enum
from google.auth.credentials import Credentials
from google.cloud.asset_v1 import AssetServiceClient
from google.cloud.orgpolicy_v2 import OrgPolicyClient
from google.cloud.resourcemanager_v3 import OrganizationsClient, FoldersClient, ProjectsClient
from google.cloud.service_usage_v1 import ServiceUsageClient


class NodeType(Enum):
    NULL = 0
    ORGANIZATION = 1
    FOLDER = 2
    PROJECT = 3
    BOOTSTRAP_PROJECT = 4


class Node:
    name: str = ""
    display_name: str = ""
    children: list = None
    type: NodeType = NodeType.NULL
    liens = None

    def __init__(self, name="", display_name="", type=NodeType.NULL, liens=None):
        self.name = name
        self.display_name = display_name
        self.children = []
        self.type = type
        self.liens = liens

    def __repr__(self):
        return self.display_name or self.name


class NonCriticalException(Exception):
    non_critical = True


class Config:
    FOLDER_ASSET_TYPE: str = "cloudresourcemanager.googleapis.com/Folder"
    PROJECT_ASSET_TYPE: str = "cloudresourcemanager.googleapis.com/Project"
    HAS_POLICY_TROUBLESHOOTER_API_ENABLED: bool = False
    BOOSTRAP_PROJECT_ID: str = ''
    SERVICE_ACCOUNT_EMAIL: str = ''
    REQUIRED_APIS: set = {
        'cloudresourcemanager.googleapis.com',
        'orgpolicy.googleapis.com',
        'cloudasset.googleapis.com'
    }
    SERVICE_ACCOUNT_ROLES: set = {
        'roles/serviceusage.serviceUsageAdmin',  # Permission needed to enable APIs
        'roles/browser',  # Permission needed to browse the hierarchy of an organization.
        'roles/resourcemanager.lienModifier',  # Permission needed to delete projects liens.
        'roles/resourcemanager.projectDeleter',  # Permission needed to delete projects.
        'roles/resourcemanager.folderMover',  # Permission needed to move folders.
        'roles/resourcemanager.folderEditor',  # Permission needed to delete folders.
        'roles/orgpolicy.policyAdmin',  # Permission needed to create and delete organization policies.
        'roles/resourcemanager.organizationAdmin',  # Permission needed to create and delete IAM policies.
    }
    ORGANIZATION_ID: str = None
    ORGANIZATION_NODE: Node = None
    PROTECTED_PRINCIPALS: set = {}
    NEW_ORGANIZATION_POLICIES: list = None
    BOOTSTRAP_PROJECT_ID: str = None
    ORGANIZATION_POLICIES: list = None


class GoogleAPI:
    organizations: OrganizationsClient = None
    folders: FoldersClient = None
    projects: ProjectsClient = None
    services: ServiceUsageClient = None
    org_policies: OrgPolicyClient = None
    iam_policies: AssetServiceClient = None

    credentials: Credentials = None
    project_id: str = None

    def __init__(self):
        self.update_credentials(google.auth.default()[0])
        self.update_clients_credentials()

    def refresh_credentials_token(self):
        request = google.auth.transport.requests.Request()
        self.credentials.refresh(request)

    def update_credentials(self, credentials):
        self.credentials = credentials
        self.refresh_credentials_token()

    def update_clients_credentials(self):
        self.organizations = OrganizationsClient(credentials=self.credentials)
        self.folders = FoldersClient(credentials=self.credentials)
        self.projects = ProjectsClient(credentials=self.credentials)
        self.services = ServiceUsageClient(credentials=self.credentials)
        self.org_policies = OrgPolicyClient(credentials=self.credentials)
        self.iam_policies = AssetServiceClient(credentials=self.credentials)

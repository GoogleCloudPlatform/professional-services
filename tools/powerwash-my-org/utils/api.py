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

import json
from random import randint

import requests
from google.api_core import exceptions
from google.api_core.retry import Retry, if_exception_type
from google.cloud.orgpolicy_v2 import Policy, PolicySpec
from google.cloud.resourcemanager_v3 import Project, ListProjectsRequest, ListFoldersRequest
from google.cloud.service_usage_v1 import BatchEnableServicesRequest
from google.iam.v1.iam_policy_pb2 import SetIamPolicyRequest
from google.iam.v1.policy_pb2 import Policy as IAMPolicy
from google.oauth2.credentials import Credentials

from utils import classes, config

clients = classes.GoogleAPI()


def get_organization_name(organization_id: str):
    return clients.organizations.get_organization(
        name=f"organizations/{organization_id}"
    ).display_name


def create_service_account() -> dict:
    url = f"https://iam.googleapis.com/v1/projects/{config.BOOTSTRAP_PROJECT_ID}/serviceAccounts"
    payload = {
        "accountId": "powerwash-sa-" + f"{randint(1000, 9999)}",
        "serviceAccount": {
            "displayName": "Powerwash Service Account"
        }
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {clients.credentials.token}"
    }
    response = requests.post(url=url, headers=headers, data=json.dumps(payload))
    return response.json()


def create_service_account_keys():
    url = f"https://iam.googleapis.com/v1/projects/{config.BOOTSTRAP_PROJECT_ID}/serviceAccounts/{config.SERVICE_ACCOUNT_EMAIL}/keys"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {clients.credentials.token}"
    }
    response = requests.post(url=url, headers=headers)
    return response.json()


def update_clients_credentials(sa_credentials: Credentials):
    clients.credentials = sa_credentials
    clients.update_clients_credentials()


def create_bootstrap_project(organization_id: str) -> str:
    project = Project()
    project.display_name = "powerwash-bootstrap-prj"
    project.project_id = project.display_name + f"-{randint(1000, 9999)}"
    project.parent = f"organizations/{organization_id}"
    operation = clients.projects.create_project(
        project=project
    )
    bootstrap_project = operation.result()
    return bootstrap_project.project_id


def get_liens(parent: str) -> list:
    url = "https://cloudresourcemanager.googleapis.com/v3/liens"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {clients.credentials.token}"
    }
    params = {
        "parent": parent
    }
    response = requests.get(url=url, headers=headers, params=params)
    liens_dict = response.json()
    return liens_dict.get('liens', [])


def get_projects(parent: str):
    request = ListProjectsRequest()
    request.parent = parent
    request.show_deleted = False
    projects_pages = clients.projects.list_projects(request=request)
    return {project.name: project for project in projects_pages.projects}


def get_folders(parent: str):
    request = ListFoldersRequest()
    request.parent = parent
    request.show_deleted = False
    folders_pages = clients.folders.list_folders(request=request)
    return {folder.name: folder for folder in folders_pages.folders}


def batch_activate_apis(required_apis: set):
    request = BatchEnableServicesRequest()
    request.parent = f'projects/{config.BOOTSTRAP_PROJECT_ID}'
    request.service_ids = required_apis
    operation = clients.services.batch_enable_services(request=request)
    operation.result()


def get_org_policies():
    retry = Retry(predicate=if_exception_type(exceptions.PermissionDenied), multiplier=1, deadline=240)
    return clients.org_policies.list_policies(parent=f"organizations/{config.ORGANIZATION_ID}", retry=retry)


def set_org_policy(org_policy: dict):
    policy = Policy()
    policy_spec = PolicySpec()
    retry = Retry(predicate=if_exception_type(exceptions.PermissionDenied), multiplier=1, deadline=240)

    for rule in org_policy['rules']:
        policy_rule = policy_spec.PolicyRule()
        setattr(policy_rule, rule, org_policy['rules'][rule])
        policy_spec.rules.append(policy_rule)

    policy.name = f"organizations/{config.ORGANIZATION_ID}/policies/{org_policy['name']}"
    policy.spec = policy_spec
    clients.org_policies.create_policy(parent=f"organizations/{config.ORGANIZATION_ID}", policy=policy, retry=retry)


def delete_project(project: str):
    operation = clients.projects.delete_project(name=f"projects/{project}")
    operation.result()


def delete_folder(folder: str, ):
    operation = clients.folders.delete_folder(name=folder)
    operation.result()


def delete_org_policy(org_policy_name: str):
    clients.org_policies.delete_policy(name=org_policy_name)


def get_iam_policies() -> IAMPolicy:
    return clients.organizations.get_iam_policy(resource=f"organizations/{config.ORGANIZATION_ID}")


def update_iam_policies(iam_policies: Policy):
    request = SetIamPolicyRequest(
        resource=f"organizations/{config.ORGANIZATION_ID}",
        policy=iam_policies
    )
    clients.organizations.set_iam_policy(request=request)

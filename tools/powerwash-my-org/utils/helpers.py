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

import argparse
import base64
import json
import os
from google.iam.v1.policy_pb2 import Binding, Policy
from google.oauth2 import service_account as sa
from utils import api, tui, config
from utils.classes import Node, NodeType, GoogleAPI, NonCriticalException


def output_step(text: str):
    def inner(func):
        def wrapper(*args, **kwargs):
            try:
                tui.print_text_line(text)
                func(*args, **kwargs)
                tui.print_success_line()
            except NonCriticalException as e:
                tui.print_error(str(e))
                return
            except Exception as e:
                tui.print_error(str(e))
                exit(1)

        return wrapper

    return inner


@output_step("Loading configuration")
def load_variables():
    config_file = os.getcwd() + "/config.json"
    if os.path.exists(config_file):
        json_dict = json.load(open(config_file))
        config.ORGANIZATION_ID = json_dict["organization_id"]
        config.PROTECTED_PRINCIPALS = set(json_dict["protected_principals"])
        config.NEW_ORGANIZATION_POLICIES = json_dict["organization_policies"]

    else:
        parser = argparse.ArgumentParser()
        parser.add_argument('--org',
                            dest='organization_id',
                            type=str,
                            help='Organization ID')
        parser.add_argument('--iam',
                            dest='iam',
                            type=str,
                            help='List of principals to not delete',
                            default=None)
        parser.add_argument('--orgpolicies',
                            dest='org_policies',
                            type=str,
                            help='List of new organization policies to add after powerwash',
                            default='{}')
        args = parser.parse_args()
        config.ORGANIZATION_ID = args.organization_id
        config.PROTECTED_PRINCIPALS = set(args.iam.split(",")) if args.iam else set()
        config.NEW_ORGANIZATION_POLICIES = json.loads(args.org_policies)


@output_step("Creating service account")
def create_service_account():
    response = api.create_service_account()
    config.SERVICE_ACCOUNT_EMAIL = response.get('email')
    assign_roles_to_service_account()
    load_service_account_credentials()


def decode_service_account_info(json_response: dict) -> dict:
    private_key = json_response.get('privateKeyData')
    b64_decoded_text = base64.b64decode(private_key).decode('utf-8')
    return json.loads(b64_decoded_text)


@output_step("Enabling necessary APIs")
def enable_required_apis():
    api.batch_activate_apis(config.REQUIRED_APIS)


def build_folder_tree_root() -> Node:
    organization_display_name = api.get_organization_name(config.ORGANIZATION_ID)
    return Node(name=f"organizations/{config.ORGANIZATION_ID}",
                display_name=organization_display_name,
                type=NodeType.ORGANIZATION)


def delete_project(node: Node):
    if node.liens:
        reasons = 'This project is protected with liens.'
        cant_delete = False
        for lien in node.liens:
            if 'resourcemanager.projects.delete' in lien.get('restrictions'):
                cant_delete = True
                reasons += f"\n\t▪ ID: {lien.get('name')}\n\t  Reason: {lien.get('reason')}"
        if cant_delete:
            raise NonCriticalException(reasons)
    api.delete_project(node.name)


def get_resources(parent: str) -> dict:
    projects = api.get_projects(parent)
    folders = api.get_folders(parent)
    return {**projects, **folders}


def get_resource_type(resource: object) -> NodeType:
    if hasattr(resource, 'project_id'):
        return NodeType.PROJECT
    return NodeType.FOLDER


def build_resources_tree(node: Node):
    children = get_resources(node.name) if node.type is not NodeType.PROJECT else {}
    for resource in children.values():
        node_type = get_resource_type(resource)
        children_node = Node(
            name=resource.project_id if node_type == NodeType.PROJECT else resource.name,
            display_name=resource.display_name,
            type=node_type,
            liens=api.get_liens(resource.name) if node_type == NodeType.PROJECT else None
        )
        if children_node.name == config.BOOTSTRAP_PROJECT_ID:
            continue
        node.children.append(children_node)
        build_resources_tree(children_node)


@output_step('Getting folders and projects')
def build_organization_tree():
    organization_node = build_folder_tree_root()
    build_resources_tree(organization_node)
    config.ORGANIZATION_NODE = organization_node


def delete_resources_tree(node: Node):
    for children in node.children:
        delete_resources_tree(children)

    if node.type == NodeType.ORGANIZATION:
        return

    if node.type == NodeType.PROJECT:
        output_step(f"Deleting {node.display_name}")(delete_project)(node)
    if node.type == NodeType.FOLDER:
        output_step(f"Deleting {node.display_name}")(api.delete_folder)(node.name)


def delete_projects_and_folders():
    build_organization_tree()
    delete_resources_tree(config.ORGANIZATION_NODE)


@output_step("Getting organization policies")
def get_org_policies():
    config.ORGANIZATION_POLICIES = api.get_org_policies()


def reset_org_policies():
    for org_policy in config.ORGANIZATION_POLICIES:
        org_policy_display_name = org_policy.name.split("/")[-1]
        output_step(f"Removing {org_policy_display_name}")(api.delete_org_policy)(org_policy.name)


def set_new_org_policies():
    for policy in config.NEW_ORGANIZATION_POLICIES:
        output_step(f"Setting {policy['name']}")(api.set_org_policy)(policy)


def update_iam_bindings(iam_policies: Policy) -> Policy:
    updated_iam_policies = Policy()
    updated_bindings = []
    for binding in iam_policies.bindings:
        tui.print_text_line(f"Updating {binding.role}")
        updated_binding = Binding()
        updated_binding.role = binding.role
        updated_binding.members.MergeFrom(list(
            config.PROTECTED_PRINCIPALS.intersection(set(binding.members))))
        updated_bindings.append(updated_binding)
        tui.print_success_line()

    updated_iam_policies.bindings.MergeFrom(updated_bindings)
    return updated_iam_policies


@output_step("Deleting bootstrap project")
def cleanup_bootstrap_project():
    api.clients = GoogleAPI()
    api.delete_project(config.BOOTSTRAP_PROJECT_ID)


def load_service_account_credentials():
    keys = api.create_service_account_keys()
    service_account_credentials = sa.Credentials.from_service_account_info(
        decode_service_account_info(keys)
    )
    api.update_clients_credentials(service_account_credentials)


@output_step("Creating bootstrap project")
def create_bootstrap_project():
    config.BOOTSTRAP_PROJECT_ID = api.create_bootstrap_project(config.ORGANIZATION_ID)
    api.batch_activate_apis(config.REQUIRED_APIS)


def assign_roles_to_service_account():
    current_iam_policies = api.get_iam_policies()
    for binding in current_iam_policies.bindings:
        if binding.role in config.SERVICE_ACCOUNT_ROLES:
            binding.members.MergeFrom([f"serviceAccount:{config.SERVICE_ACCOUNT_EMAIL}"])
            config.SERVICE_ACCOUNT_ROLES.remove(binding.role)

    for role in config.SERVICE_ACCOUNT_ROLES:
        new_binding = Binding()
        new_binding.role = role
        new_binding.members.MergeFrom([f"serviceAccount:{config.SERVICE_ACCOUNT_EMAIL}"])
        current_iam_policies.bindings.MergeFrom([new_binding])

    api.update_iam_policies(current_iam_policies)

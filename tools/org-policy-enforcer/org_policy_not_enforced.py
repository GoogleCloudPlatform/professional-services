#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright 2020 Google Inc. All Rights Reserved.
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

__author__ = "misabhishek@google.com (Abhishek Mishra)"


r"""Query the project ids for which org policy `constraint` is not enforced.

To run this script, make sure you have admin privileges at your organization.

>>> python org_policy_not_enforced.py \
    --organization="organizations/[YOUR-ORGANIZATION-ID]" \
    --constraint="[ORG-POLICY-CONSTRAINT]" \
    --to_json="[FILE-PATH-TO-STORE-THE-DATA]"
"""

import argparse
from concurrent import futures
import functools
import json

from googleapiclient.discovery import build

from google.cloud import asset_v1p1beta1


def get_all_projects_using_asset_manager(organization, credentials=None):
    """Returns project ids using asset manager apis.

  Args:
    organization: (str) organization/[ORGANIZATION_ID]
    credentials: client credentials
  """
    project_prefix = "//cloudresourcemanager.googleapis.com/projects/"
    client_v1p1beta1 = asset_v1p1beta1.AssetServiceClient(
        credentials=credentials)
    all_projects = client_v1p1beta1.search_all_resources(
        scope=organization,
        asset_types=["cloudresourcemanager.googleapis.com/Project"])
    return [p.name[len(project_prefix):] for p in all_projects]


def is_org_policy_enforced(project_id, constraint, credentials=None):
    """Returns whether the given org policy `constraint` is effective.

  Args:
    project_id: (str) project id
    constraint: (bool) org policy constraint
    credentials: client credentials
  """
    resourcemanager_v1 = build("cloudresourcemanager",
                               "v1",
                               credentials=credentials)
    policy = resourcemanager_v1.projects().getEffectiveOrgPolicy(
        resource=f"projects/{project_id}", body={
            "constraint": constraint
        }).execute()
    return project_id, policy["booleanPolicy"].get("enforced", False)


def filter_projects_having_org_policy_not_enforced(project_ids,
                                                   constraint,
                                                   credentials=None):
    """Returns the `project_ids` for which org policy `constraint` is not effective.

  Args:
    project_ids: List(str) project ids
    constraint: (bool) org policy constraint
    credentials: client credentials
  """
    f = functools.partial(is_org_policy_enforced,
                          constraint=constraint,
                          credentials=credentials)
    with futures.ThreadPoolExecutor(max_workers=50) as executor:
        org_policy_enforced_state = executor.map(f, project_ids)
    return [
        project_id for project_id, enforced in org_policy_enforced_state
        if not enforced
    ]


def to_json(project_ids, constraint, organization, file_path):
    """Store the `project_ids` not enforcing `constraint` into locaiton `file_path`.

  Args:
    project_ids: List(str)
    constraint: (str) org policy constraint
    organization: (str) organization to which project_ids belongs.
    file_path: (str) location to store the information.
  """
    information = {
        "organization": organization,
        "constraint": constraint,
        "project_ids_with_constraint_not_enforced": project_ids
    }
    json.dump(information, open(file_path, "w"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Find projects with org policy not enforced.")
    parser.add_argument(
        "--organization",
        required=True,
        type=str,
        help=
        "Enter the organization id in the format organizations/[ORGANIZATION_ID]."
    )
    parser.add_argument(
        "--constraint",
        type=str,
        nargs="?",
        default="constraints/dataflow.enforceComputeDefaultServiceAccountCheck",
        help="Enter the org policy constraint.")
    parser.add_argument(
        "--to_json",
        type=str,
        nargs="?",
        default="",
        help="Enter the json file name to store the project ids.")
    args = parser.parse_args()
    all_project_ids = get_all_projects_using_asset_manager(args.organization)
    filtered_project_ids = filter_projects_having_org_policy_not_enforced(
        all_project_ids, args.constraint)
    if not args.to_json:
        print("\n".join(filtered_project_ids))
    else:
        to_json(filtered_project_ids, args.constraint, args.organization,
                args.to_json)

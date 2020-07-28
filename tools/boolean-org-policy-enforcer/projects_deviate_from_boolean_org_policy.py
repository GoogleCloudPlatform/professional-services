#!/usr/bin/env python3
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
r"""Query the project ids for which org policy `constraint` deviates from the expected state.

python projects_deviate_from_boolean_org_policy.py \
--organization="organizations/[YOUR-ORGANIZATION-ID]" \
--boolean_constraint="[ORG-POLICY-BOOLEAN-CONSTRAINT]" \
--constraint_expected_state="Boolean(True or False)" \
--service_account_file_path="[FILE-PATH-TO-SERVICE-ACCOUNT]" \
--to_json="[FILE-PATH-TO-STORE-THE-DATA]"
"""

import argparse
from concurrent import futures
import functools
import json
import logging
import time

from google_auth_httplib2 import AuthorizedHttp
from googleapiclient.discovery import build
import httplib2

from google.cloud import asset_v1
from google.oauth2 import service_account

# The rate-limit decides the maximum number of request that you can send in a
# time-window. This rate-limit could help with not exhausting the resource
# quota.
# RATE_LIMIT = (Number of request, duration (in seconds))
RATE_LIMIT = (1000, 100)

# scopes for the credentials.
SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]

logger = logging.getLogger()
logger.setLevel(logging.INFO)
# Uncomment the below line to get detailed logs.
# httplib2.debuglevel = 4


def get_all_projects_using_asset_manager(organization, credentials):
    """Returns project ids using asset manager apis.

  Args:
    organization: (str) organization/[ORGANIZATION_ID]
    credentials: client credentials
  """
    project_prefix = "//cloudresourcemanager.googleapis.com/projects/"
    client_v1 = asset_v1.AssetServiceClient(credentials=credentials)
    all_projects = client_v1.search_all_resources(
        scope=organization,
        asset_types=["cloudresourcemanager.googleapis.com/Project"])
    return [p.name[len(project_prefix):] for p in all_projects]


def is_org_policy_enforced(project_id, resourcemanager_v1, constraint,
                           credentials):
    """Returns whether the given org policy `constraint` is effective.

  Args:
    project_id: (str) project id
    resourcemanager_v1: RPC stub for calling resourcemanager api
    constraint: (bool) org policy constraint
    credentials: client credentials
  """
    http = httplib2.Http()
    authorize_http = AuthorizedHttp(credentials, http=http)
    policy = resourcemanager_v1.projects().getEffectiveOrgPolicy(
        resource="projects/" + project_id,
        body={
            "constraint": constraint
        },
        fields="booleanPolicy/enforced").execute(http=authorize_http)
    return project_id, policy["booleanPolicy"].get("enforced", False)


def filter_projects_having_org_policy_not_enforced(project_ids, constraint,
                                                   expected_state_of_constraint,
                                                   organization, credentials):
    """Returns the `project_ids` for which org policy `constraint` is not effective.

  Args:
    project_ids: List(str) project ids
    constraint: (str) org policy constraint
    expected_state_of_constraint: (bool) expected state of the above constraint
    organization: (str) organization id
    credentials: client credentials
  """

    resourcemanager_v1 = build("cloudresourcemanager",
                               "v1",
                               credentials=credentials)

    f = functools.partial(is_org_policy_enforced,
                          resourcemanager_v1=resourcemanager_v1,
                          constraint=constraint,
                          credentials=credentials)

    max_request, duration = RATE_LIMIT
    i = 0
    n = len(project_ids)
    unenforced = []
    while i < n:
        cur_time_in_seconds = int(time.time())
        with futures.ThreadPoolExecutor(max_workers=max_request) as executor:
            org_policy_enforced_state = executor.map(
                f, project_ids[i:i + max_request])
        i += max_request
        after_execution_time_in_seconds = int(time.time())
        diff = after_execution_time_in_seconds - cur_time_in_seconds
        if diff < duration and i < n:
            time.sleep(duration - diff)
        unenforced.extend(
            project_id for project_id, enforced in org_policy_enforced_state
            if enforced != expected_state_of_constraint)
        print("Finish investigating {} projects out of total {}.".format(
            min(i, n), n),
              flush=True)
    information = {
        "organization": organization,
        "boolean_constraint": constraint,
        "expected_state": expected_state_of_constraint,
        "project_with_expected_state_not_enforced": sorted(unenforced)
    }
    return json.dumps(information, indent=4, sort_keys=True)


def writefile(json_data, file_path):
    """Store the `json_data` into locaiton `file_path`.

  Args:
    json_data: (str) json data serialized into string
    file_path: (str) location to store the information.
  """
    with open(file_path, "w") as outfile:
        outfile.write(json_data)


def main():

    def str2bool(v):
        """Helper for parsing boolean inputs.

    Args:
      v: (str) argument from parser

    Returns:
      bool for the input argument
    """
        if isinstance(v, bool):
            return v
        if v.lower() in ("yes", "true", "t", "y", "1"):
            return True
        elif v.lower() in ("no", "false", "f", "n", "0"):
            return False
        else:
            raise argparse.ArgumentTypeError("Boolean value expected.")

    parser = argparse.ArgumentParser(
        description="Find projects who deviates from the expected state of a "
        "boolean organization policy constraint.")
    parser.add_argument(
        "--organization",
        required=True,
        type=str,
        help=
        "Enter the organization id in the format organizations/[ORGANIZATION_ID]."
    )
    parser.add_argument("--boolean_constraint",
                        type=str,
                        required=True,
                        help="Enter the org policy boolean constraint.")
    parser.add_argument(
        "--service_account_file_path",
        required=True,
        type=str,
        help="Enter the location of service account key for the resources.")
    parser.add_argument(
        "--constraint_expected_state",
        type=str2bool,
        required=True,
        help="Enter the expected state of the boolean constraint True or False."
    )
    parser.add_argument(
        "--to_json",
        type=str,
        nargs="?",
        default="",
        help="Enter the json file name to store the project ids.")
    args = parser.parse_args()
    max_request, duration = RATE_LIMIT

    sa_credentials = service_account.Credentials.from_service_account_file(
        args.service_account_file_path, scopes=SCOPES)
    all_project_ids = get_all_projects_using_asset_manager(
        args.organization, sa_credentials)
    print("Total number of projects in your organization is {}.".format(
        len(all_project_ids)))
    print("It would take approximately {0:0.2f} seconds to finish this script.".
          format(len(all_project_ids) / max_request * duration))
    deviated_projects = filter_projects_having_org_policy_not_enforced(
        all_project_ids, args.boolean_constraint,
        args.constraint_expected_state, args.organization, sa_credentials)

    if not args.to_json:
        print(deviated_projects)
    else:
        writefile(deviated_projects, args.to_json)
        print("The output of the script is in " + args.to_json)


if __name__ == "__main__":
    main()

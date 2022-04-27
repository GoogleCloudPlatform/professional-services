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
r"""Grant principals with missing permissions appropriate role.

python grant_role.py \
--role="[ROLE-TO-BE-GRANTED-TO-PRINCIPALS]" \
--projects_location="[LOCATION-OF-PROJECT-DATA]" \
--service_account_file_path="[FILE-PATH-TO-SERVICE-ACCOUNT-FOR-CREDENTIAL]" \
--to_json="[LOCATION-OF-OUTPUT-JSON-FILE]"
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


def grant_role(resource, principals, iam_v1, role, credentials):
    """Grant a given `role` on the `resource` to a set of `principals`.

  Args:
    resource: (str) full resource name that should be assigned the role.
    principals: List(str) The list of principals that should be assigned the
      role.
    iam_v1: RPC stub for calling IAM api
    role: (str) The role that should be assigned to the resource.
    credentials: client credentials

  Returns:
    The new policy on the resource with the newly granted bindings.
  """
    http = httplib2.Http()
    authorize_http = AuthorizedHttp(credentials, http=http)
    resource_prefix = "//iam.googleapis.com/"
    resource_name = resource[len(resource_prefix):]
    cur_policy = iam_v1.projects().serviceAccounts().getIamPolicy(
        resource=resource_name).execute(http=authorize_http)
    del cur_policy["etag"]

    new_bindings = {"role": role, "members": principals}
    cur_policy.setdefault("bindings", []).append(new_bindings)

    new_policy = iam_v1.projects().serviceAccounts().setIamPolicy(
        resource=resource_name, body={
            "policy": cur_policy
        }).execute()
    return {"resource": resource, "new_policy": new_policy}


def grant_role_to_principals(projects, role, credentials):
    """Grant role to principals on the resource in projects.

  Args:
    projects: Dict(str: Dict) containing the information of projects, and their
      resource, and the principals with missing permission on the resource.
    role: (str) The role that should be assigned to the resource.
    credentials: client credentials.

  Returns:
    The new policies on the resource of the projects.
  """
    resources = []
    principals = []
    project_ids = []
    for p in projects["projects"]:
        resources.append(p["resource"])
        principals.append(p["principals_with_missing_permissions"])
        project_ids.append(p["project_id"])

    iam_v1 = build("iam", "v1", credentials=credentials)
    f = functools.partial(grant_role,
                          iam_v1=iam_v1,
                          role=role,
                          credentials=credentials)

    max_request, duration = RATE_LIMIT
    i = 0
    n = len(project_ids)
    all_resource_policies = []
    while i < n:
        cur_time_in_seconds = int(time.time())
        with futures.ThreadPoolExecutor(max_workers=max_request) as executor:
            new_resource_policies = executor.map(f,
                                                 resources[i:i + max_request],
                                                 principals[i:i + max_request])
        i += max_request
        after_execution_time_in_seconds = int(time.time())
        diff = after_execution_time_in_seconds - cur_time_in_seconds
        if diff < duration and i < n:
            time.sleep(duration - diff)
        all_resource_policies.extend(new_resource_policies)
        print("Finish setting policies on {} service accounts out of total {}.".
              format(min(i, n), n),
              flush=True)
    information = {"new policy on resource": list(all_resource_policies)}
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
    parser = argparse.ArgumentParser(
        description="Grants role to principals with missing permissions.")
    parser.add_argument(
        "--role",
        type=str,
        required=True,
        help=
        "role that should be granted to the principals with missing permissions."
    )
    parser.add_argument(
        "--projects_location",
        type=str,
        required=True,
        help="Location to json file containing projects with information about "
        "resource and principals with missing permissions.")
    parser.add_argument(
        "--service_account_file_path",
        required=True,
        type=str,
        help="Enter the location of service account key for the credentials.")
    parser.add_argument(
        "--to_json",
        type=str,
        default="",
        help="Enter the json file name to store the set policy responses.")

    args = parser.parse_args()
    sa_credentials = service_account.Credentials.from_service_account_file(
        args.service_account_file_path, scopes=SCOPES)

    all_projects = json.load(open(args.projects_location))
    all_set_policy_responses = grant_role_to_principals(all_projects, args.role,
                                                        sa_credentials)
    if not args.to_json:
        print(all_set_policy_responses)
    else:
        writefile(all_set_policy_responses, args.to_json)
        print("The output of the script is in " + args.to_json)


if __name__ == "__main__":
    main()

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
r"""Gives the ability to apply org policy constraints on many projects in bulk.

python enforce_boolean_org_policy_in_bulk.py \
--location_of_projects_with_org_policy_not_enforced="[FILE-PATH-TO-PROJECT-LOCATION]"
\
--service_account_file_path="[FILE-PATH-TO-SERVICE-ACCOUNT]" \
--to_json="[LOCATION-OF-OUTPUT-JSON-FILE]"
"""

import argparse
from concurrent import futures
import functools
import json
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


def enforced_org_policy_for_a_project(project_id, resourcemanager_v1,
                                      constraint, expected_state, credentials):
    """Sets the given org policy constrain on a given project.

  This is a helper function to concurrently set org policy on many project ids.
  Args:
    project_id: (str) project id.
    resourcemanager_v1: RPC stub for calling resourcemanager api
    constraint: (str) org policy constraint.
    expected_state: (bool) the expected state of the org-policy constraint.
    credentials: client credentials.

  Returns:
    The response of org policy call
  """
    http = httplib2.Http()
    authorize_http = AuthorizedHttp(credentials, http=http)
    enforced_policy_body = {
        "policy": {
            "booleanPolicy": {
                "enforced": expected_state
            },
            "constraint": constraint
        }
    }
    new_policy = resourcemanager_v1.projects().setOrgPolicy(
        resource="projects/" + project_id,
        body=enforced_policy_body).execute(http=authorize_http)
    return {"project_id": project_id, "new_org_policy": new_policy}


def enforce_org_policy(data_location, credentials):
    """Sets the given org policy constraint on a list of project.

  Args:
    data_location: (str) location of file path containing the data for applying
      the org policy.
    credentials: client credentials.

  Returns:
    The response of org policy call
  """
    enforce_org_policy_data = json.load(open(data_location))
    project_ids = enforce_org_policy_data[
        "project_with_expected_state_not_enforced"]
    print("Total number of projects in your organization with org-policy not "
          "enforced is {}.".format(len(project_ids)))
    max_request, duration = RATE_LIMIT
    print("It would take approximately {0:0.2f} seconds to finish this script.".
          format(len(project_ids) / max_request * duration),
          flush=True)
    constraint = enforce_org_policy_data["boolean_constraint"]
    expected_state = enforce_org_policy_data["expected_state"]
    resourcemanager_v1 = build("cloudresourcemanager",
                               "v1",
                               credentials=credentials)
    f = functools.partial(enforced_org_policy_for_a_project,
                          resourcemanager_v1=resourcemanager_v1,
                          constraint=constraint,
                          expected_state=expected_state,
                          credentials=credentials)
    i = 0
    n = len(project_ids)
    all_set_policies = []
    while i < n:
        cur_time_in_seconds = int(time.time())
        with futures.ThreadPoolExecutor(max_workers=100) as executor:
            set_org_policy = executor.map(f, project_ids[i:i + max_request])
        i += max_request
        after_execution_time_in_seconds = int(time.time())
        diff = after_execution_time_in_seconds - cur_time_in_seconds
        if diff < duration and i < n:
            time.sleep(duration - diff)
        all_set_policies.extend(set_org_policy)
        print(
            "Finish setting org policy for {} projects out of total {}.".format(
                min(i, n), n),
            flush=True)
    information = {"org_policy": all_set_policies}
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
        description="Apply org policy constraints on projects.")
    parser.add_argument(
        "--location_of_projects_with_org_policy_not_enforced",
        required=True,
        type=str,
        help="file location containing the data for applying org policy.")
    parser.add_argument(
        "--service_account_file_path",
        required=True,
        type=str,
        help="Enter the location of service account key for the resources.")
    parser.add_argument(
        "--to_json",
        type=str,
        nargs="?",
        default="",
        help="Enter the json file name to store the project ids.")

    args = parser.parse_args()
    sa_credentials = service_account.Credentials.from_service_account_file(
        args.service_account_file_path, scopes=SCOPES)
    new_org_policies = enforce_org_policy(
        args.location_of_projects_with_org_policy_not_enforced, sa_credentials)
    if not args.to_json:
        print(new_org_policies)
    else:
        writefile(new_org_policies, args.to_json)
        print("The output of the script is in " + args.to_json)


if __name__ == "__main__":
    main()

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
r"""Grant users with insufficient permissions appropriate roles.

python grant_role.py \
--role="[ROLE-TO-BE-GRANTED-TO-USERS]" \
--projects_location="[LOCATION-OF-PROJECT-DATA]" \
--service_account_file_path="[FILE-PATH-TO-SERVICE-ACCOUNT-FOR-CREDENTIAL]" \
--to_json="[LOCATION-OF-OUTPUT-JSON-FILE]"
"""

import argparse
from concurrent import futures
import functools
import json
import time

from googleapiclient.discovery import build
from google.oauth2 import service_account

# The rate-limit decides the maximum number of request that you can send in a
# time-window. This rate-limit could help with not exhausting the resource
# quota.
# RATE_LIMIT = (Number of request, duration (in seconds))
RATE_LIMIT = (1000, 100)

# scopes for the credentials.
SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]


def grant_role(resource, members, role, credentials):
  """Grant a given `role` on the `resource` to a set of `members`.

  Args:
    resource: (str) full resource name that should be assigned the role.
    members: List(str) The list of members that should be assigned the role.
    role: (str) The role that should be assigned to the resource.
    credentials: client credentials

  Returns:
    The new policy on the resource with the newly granted bindings.
  """
  iam_v1 = build("iam", "v1", credentials=credentials)
  resource_prefix = "//iam.googleapis.com/"
  resource_name = resource[len(resource_prefix):]
  cur_policy = iam_v1.projects().serviceAccounts().getIamPolicy(
      resource=resource_name).execute()
  del cur_policy["etag"]

  new_bindings = {"role": role, "members": members}
  cur_policy.setdefault("bindings", []).append(new_bindings)

  new_policy = iam_v1.projects().serviceAccounts().setIamPolicy(
      resource=resource_name, body={
          "policy": cur_policy
      }).execute()
  return {"resource": resource, "new_policy": new_policy}


def grant_roles_to_members(projects, role, credentials):
  """Grant roles to members on the resource in projects.

  Args:
    projects: Dict(str: Dict) containing the information of projects, and their
      resource, and the members with insufficient permission on the resource.
    role: (str) The role that should be assigned to the resource.
    credentials: client credentials.

  Returns:
    The new policies on the resource of the projects.
  """
  resources = []
  users = []
  project_ids = []
  for p in projects["projects"]:
    resources.append(p["resource"])
    users.append(p["users_with_missing_permissions"])
    project_ids.append(p["project_id"])
  f = functools.partial(grant_role, role=role, credentials=credentials)

  max_request, duration = RATE_LIMIT
  i = 0
  n = len(project_ids)
  all_resource_policies = []
  while i < n:
    cur_time_in_seconds = int(time.time())
    with futures.ThreadPoolExecutor(max_workers=max_request) as executor:
      new_resource_policies = executor.map(f, resources[i:i + max_request],
                                           users[i:i + max_request])
    i += max_request
    after_execution_time_in_seconds = int(time.time())
    diff = after_execution_time_in_seconds - cur_time_in_seconds
    if diff < duration and i < n:
      time.sleep(duration - diff)
    all_resource_policies.extend(new_resource_policies)
  information = {"new policy on resource": list(all_resource_policies)}
  return json.dumps(information, indent=4, sort_keys=True)


def to_json(json_data, file_path):
  """Store the `json_data` into locaiton `file_path`.

  Args:
    json_data: (str) json data serialized into string
    file_path: (str) location to store the information.
  """
  with open(file_path, "w") as outfile:
    outfile.write(json_data)


if __name__ == "__main__":
  parser = argparse.ArgumentParser(
      description="Grants roles to users with insufficient permissions.")
  parser.add_argument(
      "--role",
      type=str,
      required=True,
      help="role that should be granted to the users with insufficient permissions."
  )
  parser.add_argument(
      "--projects_location",
      type=str,
      required=True,
      help="Location to json file containing projects with information about "
      "resource and users with insufficient permissions.")
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
  all_set_policy_responses = grant_roles_to_members(all_projects, args.role,
                                                    sa_credentials)
  if not args.to_json:
    print(all_set_policy_responses)
  else:
    to_json(all_set_policy_responses, args.to_json)
    print("The output of the script is in " + args.to_json)

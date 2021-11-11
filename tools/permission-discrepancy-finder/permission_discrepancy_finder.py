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
r"""Find permission discrepancies at project and the given resource level.

This tool gives the ability to find out principals who are given one set of
permissions on a project and but not given another set of permissions on the
resource level under the project.

python permission_discrepancy_finder.py \
--organization="organizations/[YOUR-ORGANIZATION-ID]" \
--resource="[RESOURCE-QUERY]" \
--project_permissions="[COMMA-SEPARATED-LIST-OF-PERMISSIONS-OF-PROJECT]" \
--resource_permission="[COMMA-SEPARATED-LIST-OF-PERMISSIONS-OF-RESOURCE]" \
--project_ids_location="[LOCATION-OF-JSON-FILE-WITH-INTERESTING-PROJECT-IDS]" \
--service_account_file_path="[FILE-PATH-TO-SERVICE-ACCOUNT]" \
--to_json"[LOCATION-OF-OUTPUT-JSON-FILE]"
"""

import argparse
from concurrent import futures
import functools
import json
import logging
import time

from google.cloud import asset_v1
from google.cloud import asset_v1p4beta1
from google.oauth2 import service_account

# The rate-limit decides the maximum number of request that you can send in a
# time-window. This rate-limit could help with not exhausting the resource
# quota.
# RATE_LIMIT = (Number of request, duration (in seconds))
RATE_LIMIT = (60, 60)

# scopes for the credentials.
SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]


class Project(object):

    def __init__(self):
        self.project_id = ""
        self.full_project_name = ""
        self.resource_under_project = ""
        self.principals_having_permissions_on_project = set()
        self.principals_having_permissions_on_resource = set()
        self.principals_with_missing_permissions = set()
        self.error = ""


def get_project_and_resource(organization, resource_query, credentials):
    """Returns all the resource satisfying the `resource_query` and their project_id tuples.

  Args:
    organization: (str) organization id.
    resource_query: (str) query for resource.
    credentials: client credentials.
  """
    query = "name : " + resource_query
    project_prefix = "//cloudresourcemanager.googleapis.com/"
    client_v1 = asset_v1.AssetServiceClient(credentials=credentials)
    resources = client_v1.search_all_resources(scope=organization, query=query)
    project_resource = []
    for resource in resources:
        project_id = "/".join(resource.name.split("/")[3:5])
        project_name = project_prefix + project_id
        resource_name = resource.name
        project_resource.append((project_name, resource_name))
    return project_resource


def get_policy_analysis_query(permissions, organization, resource):
    """Returns query for asset analyzer api.

  Args:
    permissions: List(str) permissions to search for.
    organization: (str) Organization for which the asset are searched.
    resource: The full resouce name of the project for which the iam polices
      search for.
  """
    query = asset_v1p4beta1.types.IamPolicyAnalysisQuery()
    query.parent = organization
    query.resource_selector.full_resource_name = resource
    query.access_selector.permissions.extend(permissions)
    return query


def get_all_identies_from_analysis_query_response(response):
    """Returns all identites from policy anayzer api's response.

  Args:
    response: response of policy analyzer api.
  """
    unique_identities = set()
    for r in response.main_analysis.analysis_results:
        for identity in r.identity_list.identities:
            unique_identities.add(identity.name)
    return unique_identities


def get_principals_having_permissions_on_resource(permissions, organization,
                                                  resource, credentials):
    """Returns all principals having `permissions` on `resource` under the `organization`.

  Args:
    permissions: List(str) permissions on resources.
    organization: (str) Organization for which the asset are searched.
    resource: The full resouce name of the project for which the permissions
      access is searched.
    credentials: client credentials
  """
    query = get_policy_analysis_query(permissions, organization, resource)
    client_v1p4beta1 = asset_v1p4beta1.AssetServiceClient(
        credentials=credentials)
    response = client_v1p4beta1.analyze_iam_policy(analysis_query=query)
    return get_all_identies_from_analysis_query_response(response)


def get_project_id(full_project_name):
    return full_project_name.split("/")[-1]


def get_projects_using_project_resource_tuple(project_resource_tuple,
                                              permissions_on_project,
                                              permissions_on_resource,
                                              organization, credentials):
    """Returns Project object for the given project resource tuple.

  This is a helper function to run a mult-threaded version of the code.

  Args:
    project_resource_tuple: Tuple(str, str) project, resource tuples.
    permissions_on_project: List(str) permissions that the user should have on
      project.
    permissions_on_resource: List(str) permissions that the user should have on
      resource.
    organization: (str) organization/[ORGANIZATION_ID].
    credentials: client credentials.
  """
    project_name, resource = project_resource_tuple
    project = Project()
    project.full_project_name = project_name
    project.project_id = get_project_id(project_name)
    project.resource_under_project = resource
    try:
        project.principals_having_permissions_on_project = get_principals_having_permissions_on_resource(
            permissions_on_project,
            organization,
            project.full_project_name,
            credentials=credentials)
        project.principals_having_permissions_on_resource = get_principals_having_permissions_on_resource(
            permissions_on_resource,
            organization,
            project.resource_under_project,
            credentials=credentials)
        project.principals_with_missing_permissions = (
            project.principals_having_permissions_on_project -
            project.principals_having_permissions_on_resource)
        if not project.principals_with_missing_permissions:
            logging.info(
                "No permission discrepancy found for project: %s and resource: %r",
                project.project_id, project.resource_under_project)
            return None
        logging.info(
            "Permission discrepancy found for project: %s and resource: %r",
            project.project_id, project.resource_under_project)
        return project
    except Exception as e:
        project.error = str(e)
        logging.warning(
            "Cannot retrive data for project: %s because of error %s.",
            project.project_id, project.error)
        return project


def extract_information(projects):
    """Returns a subset of information from  projects.

  Args:
    projects: List(Project)
  """
    projects_list = []
    for p in projects:
        cur_project = {
            "project_id":
                p.project_id,
            "resource":
                p.resource_under_project,
            "principals_with_missing_permissions":
                list(p.principals_with_missing_permissions) if not p.error else
                "Could not retrive user data because " + p.error
        }
        projects_list.append(cur_project)
    return projects_list


def get_projects(organization, permissions_on_project, permissions_on_resource,
                 resource_query, credentials):
    """Returns Project objects from the given project resource tuples.

  Args:
    organization: (str) Organization for which the  projects are searched.
    permissions_on_project: List(str) permissions from gcp services.
    permissions_on_resource: List(str) service account impersonation
      permissions.
    resource_query: (str) query for the resource for which to check the
      permission discrepancy. Please see here about how to construct a query for
    a resource. https://cloud.google.com/asset-inventory/docs/query-syntax
    credentials: client credentials.
  """
    project_resource_tuples = get_project_and_resource(organization,
                                                       resource_query,
                                                       credentials)
    print(
        "Total number of projects and resource pair with the resource {} are {}."
        .format(resource_query, len(project_resource_tuples)),
        flush=True)
    max_request, duration = RATE_LIMIT
    # Since we are making 2 request per project-resource pair, we need to reduce
    # the max_request by 2.
    max_request = max_request // 2
    print("It would take approximately {0:0.2f} seconds to finish this script.".
          format(len(project_resource_tuples) / max_request * duration),
          flush=True)
    f = functools.partial(get_projects_using_project_resource_tuple,
                          permissions_on_project=permissions_on_project,
                          permissions_on_resource=permissions_on_resource,
                          organization=organization,
                          credentials=credentials)
    i = 0
    n = len(project_resource_tuples)
    found_projects = []
    while i < n:
        cur_time_in_seconds = int(time.time())
        with futures.ThreadPoolExecutor(max_workers=max_request) as executor:
            projects = executor.map(f,
                                    project_resource_tuples[i:i + max_request])
        i += max_request
        after_execution_time_in_seconds = int(time.time())
        diff = after_execution_time_in_seconds - cur_time_in_seconds
        if diff < duration and i < n:
            time.sleep(duration - diff)
        found_projects.extend(p for p in projects if p)

    return extract_information(found_projects)


def wrap_project_id_into_project(given_project_ids):
    """Returns an Project object for a given project_id.

  Args:
    given_project_ids: List(str)
  """
    projects = []
    for p in given_project_ids:
        project = Project()
        project.project_id = p
        projects.append(project)
    return projects


def combine_projects_with_given_projects(projects, user_provided_projects):
    """Returns Project object combined with the user provider projects.

  Args:
    projects: List(Project)
    user_provided_projects: List(str)
  """
    if not user_provided_projects:
        user_provided_projects = projects
    else:
        user_provided_projects = wrap_project_id_into_project(
            user_provided_projects)
        project_dict = {p.project_id: p for p in projects}
        for i in range(len(user_provided_projects)):
            cur_id = user_provided_projects[i].project_id
            if cur_id in project_dict:
                user_provided_projects[i] = project_dict[cur_id]
        user_provided_projects = extract_information(user_provided_projects)
    information = {"projects": user_provided_projects}
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
        description="Find prinicipals having missing permissions.")
    parser.add_argument(
        "--organization",
        required=True,
        type=str,
        help=
        "Enter the organization id in the format organizations/[ORGANIZATION_ID]."
    )
    parser.add_argument(
        "--resource",
        required=False,
        type=str,
        default='"*-compute@developer.gserviceaccount.com*"',
        help="Enter the query for the resouce for which to check the discrepancy."
        " For more detail about how to construct a query for a resource, see"
        " https://cloud.google.com/asset-inventory/docs/query-syntax ")
    parser.add_argument(
        "--project_permissions",
        required=True,
        type=str,
        help=
        "Enter the project's permissions that a user should have on project.")
    parser.add_argument(
        "--resource_permissions",
        required=True,
        type=str,
        help=
        "Enter the resouce's permissions that a user should have on project.")
    parser.add_argument(
        "--project_ids_location",
        type=str,
        default="",
        help=
        "Location of json file containing project ids for which the discrepancy should be checked."
    )
    parser.add_argument(
        "--service_account_file_path",
        required=True,
        type=str,
        help="Enter the location of service account key for getting credentials."
    )
    parser.add_argument("--to_json",
                        type=str,
                        nargs="?",
                        default="",
                        help="Enter the json file name to store the data.")
    parser.add_argument(
        "--log",
        type=str,
        nargs="?",
        default="INFO",
        help="Enter the log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)")

    args = parser.parse_args()

    numeric_level = getattr(logging, args.log.upper(), None)
    if not isinstance(numeric_level, int):
        raise ValueError("Invalid log level: %s" % args.log)
    logging.basicConfig(format="%(levelname)s[%(asctime)s]:%(message)s",
                        level=numeric_level)

    sa_credentials = service_account.Credentials.from_service_account_file(
        args.service_account_file_path, scopes=SCOPES)

    project_permissions = [
        p.strip() for p in args.project_permissions.split(",")
    ]
    resource_permissions = [
        p.strip() for p in args.resource_permissions.split(",")
    ]
    if args.project_ids_location:
        project_ids = json.load(args.project_ids_location)["project_ids"]
    else:
        project_ids = []

    all_projects = get_projects(args.organization, project_permissions,
                                resource_permissions, args.resource,
                                sa_credentials)

    filtered_projects = combine_projects_with_given_projects(
        all_projects, project_ids)

    if not args.to_json:
        print(filtered_projects)
    else:
        writefile(filtered_projects, args.to_json)
        print("The output of the script is in " + args.to_json)


if __name__ == "__main__":
    main()

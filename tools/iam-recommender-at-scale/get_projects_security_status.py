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
r"""Return status of active recommendations on projects.

python get_projects_active_recommendation.py \
--organization="organizations/[YOUR-ORGANIZATION-ID]" \
--service_account_file_path="[FILE-PATH-TO-SERVICE-ACCOUNT]" \
--to_csv="[FILE-PATH-TO-STORE-THE-DATA]"
"""

import argparse
import collections
import logging

import common

from googleapiclient.discovery import build
import prettytable

from google.cloud import asset_v1
from google.oauth2 import service_account

# scopes for the credentials.
SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]
RECOMMENDATION_TYPE = "google.iam.policy.Recommender"

# The rate-limit decides the maximum number of request that you can send in a
# time-window. This rate-limit could help with not exhausting the resource
# quota.
# RATE_LIMIT = (Number of request, duration (in seconds))
RATE_LIMIT = (6000, 60)


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


def accounts_can_made_safe(project_id, state, recommendations):
    """Compute the hero metrics number of accounts that can be made safe."""

    principal_types = ["serviceAccount", "user", "group"]
    columns = [
        "Number of recommendations on {}".format(principal_type)
        for principal_type in principal_types
    ]
    safe_accounts = collections.defaultdict(set)
    for recommendation in recommendations:
        if recommendation.state != state:
            continue
        safe_accounts[recommendation.principal_type].add(
            recommendation.principal)
    return {
        "project_id": project_id,
        "stats": {
            column: len(safe_accounts[principal_type])
            for column, principal_type in zip(columns, principal_types)
        }
    }


def get_recommendation_summary_of_projects(project_ids, state, credentials):
    """Returns the summary of recommendations on all the given projects.

  Args:
    project_ids: List(str) project to which recommendation is needed.
    state: state of recommendations
    credentials: client credentials.
  """
    recommender = build("recommender",
                        "v1",
                        credentials=credentials,
                        cache_discovery=False)

    def get_metric(project_id):
        recommendation_metric = common.get_recommendations(
            project_id,
            recommender=recommender,
            state=state,
            credentials=credentials)
        return accounts_can_made_safe(project_id, state, recommendation_metric)

    recommendation_stats = common.rate_limit_execution(get_metric, RATE_LIMIT,
                                                       project_ids)
    recommendation_stats_sorted = sorted(
        recommendation_stats, key=lambda metric: -sum(metric["stats"].values()))
    return recommendation_stats_sorted


def to_print(metrics):
    """Print the recommendation data to console.

  Args:
    metrics: Recommendation data
  """
    fields = [
        "Metric Description", "Resource", "Service Accounts", "Users", "Groups",
        "Total"
    ]
    table = prettytable.PrettyTable(fields)
    metric_name = "Number of active IAM recommendations"
    for metric in metrics:
        project_id = "projects/" + metric["project_id"]
        stats = list(metric["stats"].values())
        combine_stats = sum(stats)
        table.add_row([metric_name, project_id, *stats, combine_stats])
    print(table)


def to_csv(metrics, output_file):
    """Save the recommendation data into a csv.

  Args:
    metrics: Recommendation data
    output_file: Location of output file
  """
    fields = [
        "Metric Description", "Resource", "Service Accounts", "Users", "Groups",
        "Total"
    ]
    columns = ",".join(fields) + "\n"
    with open(output_file, "w") as f:
        f.write(columns)
        metric_name = "Number of active recommendation"
        for metric in metrics:
            project_id = "projects/" + metric["project_id"]
            stats = list(metric["stats"].values())
            combine_stats = sum(stats)
            row = ",".join(
                [metric_name, project_id, *map(str, stats),
                 str(combine_stats)]) + "\n"
            f.write(row)


def main():
    parser = argparse.ArgumentParser(
        description=
        "Find recommendation status of projects from your organization.")
    parser.add_argument(
        "--organization",
        required=True,
        type=str,
        help=
        "Enter the organization id in the format organizations/[ORGANIZATION_ID]."
    )
    parser.add_argument(
        "--service_account_file_path",
        required=True,
        type=str,
        help="Enter the location of service account key for the resources.")
    parser.add_argument(
        "--to_csv",
        type=str,
        nargs="?",
        default="",
        help="Enter the csv file name to store the recommendation data.")
    parser.add_argument("--recommendation_state",
                        type=str,
                        nargs="?",
                        default="ACTIVE",
                        help="Enter the state of recommendation.")
    parser.add_argument("--log",
                        type=str,
                        nargs="?",
                        default="INFO",
                        help="Enter the log level.")
    args = parser.parse_args()

    logging.basicConfig(format="%(levelname)s[%(asctime)s]:%(message)s",
                        level="INFO")
    credentials = service_account.Credentials.from_service_account_file(
        args.service_account_file_path, scopes=SCOPES)
    projects = get_all_projects_using_asset_manager(args.organization,
                                                    credentials)
    recommendation_data = get_recommendation_summary_of_projects(
        projects, args.recommendation_state, credentials)
    if not args.to_csv:
        to_print(recommendation_data)
    else:
        to_csv(recommendation_data, args.to_csv)
        logging.info("The security status of your organization has been exported to %s.",
                     args.to_csv)


if __name__ == "__main__":
    main()

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
r"""revert recommendations on a given project.

python revert_recommendation.py \
--project="[YOUR-PROJECT-ID]" \
--recommendation_to_be_reverted="[PATH-TO-RECOMMENDATIONS-INPUT]" \
--service_account_file_path="[FILE-PATH-TO-SERVICE-ACCOUNT]" \
--to_json="[FILE-PATH-TO-STORE-THE-DATA]"
"""

import argparse
import copy
import datetime
import functools
import json
import logging

import common
from googleapiclient.discovery import build

from google.oauth2 import service_account

# scopes for the credentials.
SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]

RECOMMENDATION_TYPE = "google.iam.policy.Recommender"

# The rate-limit decides the maximum number of request that you can send in a
# time-window. This rate-limit could help with not exhausting the resource
# quota.
# RATE_LIMIT = (Number of request, duration (in seconds))
RATE_LIMIT = (3000, 60)


def get_all_applied_recommendations_by_automated_script(all_recommendations,
                                                        date):
    """Returns all the recommendations applied on a given date by the script.

  Args:
    all_recommendations: Dict all recommedantion data.
    date: date on which the recommendation is applied.
  """
    recommendations = []
    for r in all_recommendations:
        if r["stateInfo"]["state"] != "SUCCEEDED":
            continue
        if "stateMetadata" not in r["stateInfo"]:
            continue
        if "applied_by" not in r["stateInfo"]["stateMetadata"]:
            continue
        if r["stateInfo"]["stateMetadata"][
                "applied_by"] != f"bulk_apply_by_automated_script-{date}":
            continue
        recommendations.append(r)
    return recommendations


def update_policy_to_revert_recommendations(policy, recommendations):
    """Update the old policy based on recommendations.

  Args:
    policy: old IAM policy.
    recommendations: Recommendation on IAM policy.

  Returns:
    new IAM policy.
  """
    new_policy = copy.deepcopy(policy)
    success = []
    for recommendation in recommendations["recommendations"]:
        temp = recommendation["role_recommended_to_be_removed"]
        recommendation["role_recommended_to_be_removed"] = recommendation[
            "roles_recommended_to_be_replaced_with"]
        recommendation["roles_recommended_to_be_replaced_with"] = temp
        is_success_add = common.add_roles_in_policy(new_policy, recommendation)
        is_success_removed = common.remove_role_from_policy(
            new_policy, recommendation)
        success.append(is_success_removed and is_success_add)
    return new_policy, success


def update_recommendation_status_after_revert(client, recommendations,
                                              success_status, credentials):
    """Mark the recommendation status to be reverted after reverting the recommendations.

  Args:
    recommender_client: Iam recommender client.
    recommendations: Recommendation on IAM policy.

  Returns:
    Recommendations with updated status.
  """
    successful_revert_recommendation = [
        r
        for r, status in zip(recommendations["recommendations"], success_status)
        if status
    ]
    metadata = {
        "reverted":
            "true",
        "reverted_by":
            "bulk_revert_by_automated_script-{}".format(
                datetime.datetime.now().strftime("%Y-%m-%d"))
    }
    f = functools.partial(common.update_recommendation_status,
                          recommender_client=client,
                          metadata=metadata,
                          credentials=credentials)
    recommendation_after_status_change = common.rate_limit_execution(
        f, RATE_LIMIT, successful_revert_recommendation)
    return json.dumps(
        {"applied_recommendation": list(recommendation_after_status_change)},
        indent=4)


def main():
    parser = argparse.ArgumentParser(
        description="Reverting recommendations for a given project.")
    parser.add_argument(
        "--project_id",
        required=True,
        type=str,
        help="Enter project id for which you want the recommendation status.")
    parser.add_argument(
        "--service_account_file_path",
        required=True,
        type=str,
        help="Enter the location of service account key for the resources.")
    parser.add_argument(
        "--recommendation_to_be_reverted",
        required=True,
        type=str,
        help=
        "Enter the location of file containing the recommendations to be reverted."
    )
    parser.add_argument(
        "--to_json",
        type=str,
        nargs="?",
        default="",
        help="Enter the json file name to store the new policy change data.")
    parser.add_argument("--log",
                        type=str,
                        nargs="?",
                        default="INFO",
                        help="Enter the log level.")
    args = parser.parse_args()

    logging.basicConfig(format="%(levelname)s[%(asctime)s]:%(message)s",
                        level=args.log)
    credentials = service_account.Credentials.from_service_account_file(
        args.service_account_file_path, scopes=SCOPES)

    resourcemanager_v1 = build("cloudresourcemanager",
                               "v1",
                               credentials=credentials,
                               cache_discovery=False)
    recommender = build("recommender",
                        "v1",
                        credentials=credentials,
                        cache_discovery=False)
    old_policy = common.get_current_policy(resourcemanager_v1, args.project_id,
                                           credentials)

    recommendation_to_be_reverted = json.load(
        open(args.recommendation_to_be_reverted))
    new_policy, success_status = update_policy_to_revert_recommendations(
        old_policy, recommendation_to_be_reverted)

    logging.info("Applying the recommendation")
    common.update_policy(resourcemanager_v1, args.project_id, credentials,
                         new_policy)

    logging.info(
        "Diff between old policy and the new policy after reverting the recommendation "
    )
    logging.info(common.diff_between_policies(old_policy, new_policy))
    updated_recommendations = update_recommendation_status_after_revert(
        recommender, recommendation_to_be_reverted, success_status, credentials)

    if not args.to_json:
        logging.info(updated_recommendations)
    else:
        common.writefile(updated_recommendations, args.to_json)


if __name__ == "__main__":
    main()

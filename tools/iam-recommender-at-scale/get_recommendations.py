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
r"""Return all active recommendations on a given project.

python get_recommendation.py \
--project="[YOUR-PROJECT-ID]" \
--service_account_file_path="[FILE-PATH-TO-SERVICE-ACCOUNT]" \
--to_json="[FILE-PATH-TO-STORE-THE-DATA]"
"""

import argparse
import logging
import common

from googleapiclient.discovery import build

from google.oauth2 import service_account

# scopes for the credentials.
SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]

RECOMMENDATION_TYPE = "google.iam.policy.Recommender"


def main():
    parser = argparse.ArgumentParser(
        description="Get recommendations for a given project.")
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
        "--to_json",
        type=str,
        nargs="?",
        default="",
        help="Enter the json file name to store the recommendation data.")
    parser.add_argument("--log",
                        type=str,
                        nargs="?",
                        default="INFO",
                        help="Enter the log level.")
    parser.add_argument("--recommendation_state",
                        type=str,
                        nargs="?",
                        default="ACTIVE",
                        help="Enter the state of recommendation.")
    args = parser.parse_args()

    logging.basicConfig(format="%(levelname)s[%(asctime)s]:%(message)s",
                        level=args.log)
    credentials = service_account.Credentials.from_service_account_file(
        args.service_account_file_path, scopes=SCOPES)

    recommender = build("recommender",
                        "v1",
                        credentials=credentials,
                        cache_discovery=False)
    recommendation_data = common.get_recommendations(args.project_id,
                                                     recommender,
                                                     args.recommendation_state,
                                                     credentials)
    recommendations_jsonified = common.describe_recommendations(
        recommendation_data)
    if not args.to_json:
        print(recommendations_jsonified)
    else:
        common.writefile(recommendations_jsonified, args.to_json)
        logging.info("Find the project:%s recommendations at location %s.",
                     args.project_id, args.to_json)


if __name__ == "__main__":
    main()

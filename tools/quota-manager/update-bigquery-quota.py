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
"""
This script is an example showing the usage of quota.Updater class.
This example demonstrates BigQuery quotas to the amount
of data processed per project and per user.
"""

__author__ = "yunusd@google.com (Yunus Durmus)"

import sys
import logging
import argparse
import quota

logging.basicConfig(
    format="%(asctime)s %(levelname)s:%(message)s",
    datefmt="%d/%m/%Y %H:%M:%S",
    level=logging.INFO,
)


def parse_args(args):
    parser = argparse.ArgumentParser(
        description="update bigquery quotas of a project", prog="quota updater")
    parser.add_argument(
        "-c",
        "--credential_path",
        required=True,
        help="path to the service account's credential.json file.",
    )
    parser.add_argument("-p",
                        "--project_id",
                        required=True,
                        help="id of the project")
    parser.add_argument(
        "-uq",
        "--user_quota",
        required=False,
        default="-1",
        help="quota per user in MiB, -1 for unlimited, default=-1",
    )
    parser.add_argument(
        "-pq",
        "--project_quota",
        required=False,
        default="-1",
        help="quota per project in MiB, -1 for unlimited, default=-1",
    )

    return parser.parse_args(args)


def get_list_of_all_quotas(project_id, credential_path, service_name):
    # Get a list of quotas
    quota.Updater(
        project_id=project_id,
        credential_path=credential_path,
        quota_name="not_important",
    ).get_all_consumer_quota_metrics("bigquery.googleapis.com")


def main(project_id, credential_path, user_quota, project_quota):

    # the name of the quota that you want to update
    # to find the project name use get_list_of_all_quotas method
    mib_per_project_quota_name = (
        f"projects/{project_id}/services/"
        "bigquery.googleapis.com/consumerQuotaMetrics/"
        "bigquery.googleapis.com%2Fquota%2Fquery%2Fusage/"
        "limits/%2Fd%2Fproject")

    mib_per_user_quota_updater = quota.Updater(
        project_id=project_id,
        credential_path=credential_path,
        quota_name=(mib_per_project_quota_name + "%2Fuser"),
    )
    # logging.info(mib_per_user_quota_updater.get_current_quota())
    mib_per_user_quota_updater.update_quota(user_quota)

    mib_per_project_quota_updater = quota.Updater(
        project_id=project_id,
        credential_path=credential_path,
        quota_name=mib_per_project_quota_name,
    )
    # logging.info(mib_per_project_quota_updater.get_current_quota())
    mib_per_project_quota_updater.update_quota(project_quota)


if __name__ == "__main__":

    namespace = parse_args(sys.argv[1:])

    get_list_of_all_quotas(
        project_id=namespace.project_id,
        credential_path=namespace.credential_path,
        service_name="bigquery.googleapis.com",
    )

    main(
        project_id=namespace.project_id,
        credential_path=namespace.credential_path,
        user_quota=namespace.user_quota,
        project_quota=namespace.project_quota,
    )

#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Copyright 2021 Google LLC All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
""" This is a custom BQ hook for specific
functions required for the DAG"""

import logging
from airflow.contrib.hooks.gcp_api_base_hook import GoogleCloudBaseHook
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

class BigQueryCustomHook(GoogleCloudBaseHook):
    """
    Interact with BigQuery. This hook uses the Google Cloud Platform
    connection.
    """
    conn_name_attr = "bigquery_conn_id"

    def __init__(self,
                 bigquery_conn_id="bigquery_default",
                 delegate_to=None,
                 use_legacy_sql=False,
                 location=None):
        super().__init__(
            gcp_conn_id=bigquery_conn_id, delegate_to=delegate_to)
        self.use_legacy_sql = use_legacy_sql
        self.location = location

    def get_service(self):
        """
        Returns a BigQuery service object.
        """
        http_authorized = self._authorize()
        return build(
            "bigquery", "v2", http=http_authorized, cache_discovery=False)

    def dataset_exists(self, project_id, dataset_id):
        """
        Checks for the existence of a dataset in Google BigQuery.

        :param project_id: The Google cloud project in which to look for the
            table. The connection supplied to the hook must provide access to
            the specified project.
        :type project_id: str
        :param dataset_id: The name of the dataset to look for
        :type dataset_id: str
        """
        service = self.get_service()
        try:
            service.datasets().get(
                projectId=project_id,
                datasetId=dataset_id
                ).execute(
                    num_retries=self.num_retries)
            logging.debug(f"Dataset {dataset_id} already exists")
            return True
        except HttpError as e:
            if e.resp["status"] == "404":
                return False
    
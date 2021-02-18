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
""" This is a custom GCS hook for specific
functions required for the DAG"""

import json
import logging
import time

from airflow.contrib.hooks.gcp_api_base_hook import GoogleCloudBaseHook

from google.cloud import storage

class GoogleCloudStorageCustomHook(GoogleCloudBaseHook):
    """
    Interact with Google Cloud Storage. This hook uses the Google Cloud Platform
    connection.
    """

    _conn = None


    def __init__(self,
                 google_cloud_storage_conn_id="google_cloud_default",
                 delegate_to=None):
        super().__init__(
            google_cloud_storage_conn_id,
            delegate_to)

    def get_conn(self):
        """
        Returns a Google Cloud Storage service object.
        """
        if not self._conn:
            self._conn = storage.Client(credentials=self._get_credentials(),
                                        project=self.project_id)

        return self._conn

    def create_file(
        self,
        bucket,
        filepath,
        filename,
        filecontent):
        """
        Writes contents provided to a GCS file
        :param bucket(string):
            name of bucket in which file will be created
        :param filename(string):
            path within the bucket where file will be created
        :param filename(string):
            name of the file to be created
        :param filecontent(string):
            data to be written into the file
        :return (string) absolute name of the file created
        """
        logging.debug(
            f"""printing arguments:
            bucket: {bucket}, filepath: {filepath},
            filename: {filename}, filecontent: {filecontent}
            """)

        storage_client = storage.Client()
        bucket = storage_client.get_bucket(bucket)

        abs_filename = f"{filepath}{filename}"

        logging.debug(f"abs_filename: {abs_filename}")

        blob = bucket.blob(abs_filename)
        blob.upload_from_string(filecontent)

        logging.debug("printing blob:")
        logging.debug(blob)
        time.sleep(30)
        return abs_filename

    def read_file(self,bucket,abs_file_path):
        """
        Reads contents to the GCS file
        :param bucket(string):
            bucket where file is located
        :param abs_file_path(string):
            absolute name of file to be read
        :return (string) file content
        """

        storage_client = storage.Client()
        bucket = storage_client.get_bucket(bucket)
        blob = bucket.blob(abs_file_path)

        data = json.loads(blob.download_as_string(client=None))
        logging.debug("file content:")
        logging.debug(data)
        return data

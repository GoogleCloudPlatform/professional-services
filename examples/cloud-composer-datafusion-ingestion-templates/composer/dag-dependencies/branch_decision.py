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
"""
This module containts logic to
decide the execution branch based
on the inventory of source files.
"""
import logging
from hooks.custom_gcs_hook import GoogleCloudStorageCustomHook

def get_branch(**context):
    """
    Decides the DAG task that should be executed
    based on source file inventory
    :param N/A
    :return task_name(string): name of the DAG task to be executed
    """
    source_list_abs_filename =  context["ti"].xcom_pull(
        key="src_list_abs_filename")
    system =  context["ti"].xcom_pull(key="system")
    composer_bucket =  context["ti"].xcom_pull(key="composer_bucket")

    if source_list_abs_filename is None:
        logging.debug(f"No files to process for {system}")
        return "no_files_to_process"
    else:
        # source_list = GCSOperations().read_file_contents(
        #     source_list_abs_filename)

        source_list = GoogleCloudStorageCustomHook(
            google_cloud_storage_conn_id="google_cloud_storage_default"
            ).read_file(
                bucket=composer_bucket,
                abs_file_path=source_list_abs_filename)

        if source_list is not None:
            return "generate_cdf_argument_files"
        else:
            return "no_files_to_process"
            
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
This module will be used by the Composer DAG to generate
inventory of files for ingestion by the subsequent steps in the DAG
function list_gcs_files: lists all files in the
bucket with the specified prefix
function get_source_list: This is the main
function to be called by the DAG
to generate the source file inventory
"""

import logging
import time
import json
import uuid

from airflow.contrib.hooks.gcs_hook import GoogleCloudStorageHook

from hooks.custom_gcs_hook import GoogleCloudStorageCustomHook
from dependencies.read_params import ParamReader

# class SourceList:
def list_gcs_files(gcs_hook, bucket, prefix=None):
    """
    List all fles in the bucket
    matching the provided prefix
    :param gcs_hook(GCS hook):
        GCS Hook
    :param bucket(string):
        name of bucket from which to get the list of blobs
    :param prefix(string):
        prefix (path/filename_prefix)
    :return list of file names
    """
    print(bucket, prefix)
    file_list = gcs_hook.list(bucket, prefix=prefix)
    return file_list

def get_source_list(
    system,
    dag_param_file_nm,
    task_param_file_nm,
    dag_run_id_det,
    **context):
    """
    Main function to be called by the DAG
    :param system(string):
        source system name
    :param dag_param_file_nm(string):
        name of dag param file
    :param task_param_file_nm(string):
        name of task param file
    :param dag_run_id_det(string):
        dag_run_id of the orchestrating dag
    """

    logging.debug("Start getting source list")
    params = ParamReader()
    params.read_parameters(system, dag_param_file_nm, task_param_file_nm)

    source_type = params.source_type

    source_list = []

    logging.debug(f"Reading source list from: {source_type}")

    if source_type in ("gcs","sftp"):

        gcs_hook = GoogleCloudStorageHook("google_cloud_storage_default")

        # Check whether the task_params list
        # created by read_params.py has any values

        # If Task params file is present
        if params.task_params:
            # Scan the entries in the list
            for task_param_entry in params.task_params:
                gcs_src_file_path = task_param_entry.get(
                    "gcs_src_file_path")
                filename_prefix = task_param_entry.get(
                    "filename_prefix")

                cdf_pipeline_name = task_param_entry.get(
                    "cdf_pipeline_name")

                task_entry = {}
                file_names = []

                if gcs_src_file_path and (not filename_prefix):
                    task_entry = {
                        "system": system,
                        "dag_param_file_nm": dag_param_file_nm,
                        "task_param_file_nm": task_param_file_nm,
                        "task_id": gcs_src_file_path,
                        "src_list": [],
                        "cdf_pipeline_name": cdf_pipeline_name,
                        "orchestrator_dag_run_id": dag_run_id_det
                    }
                    file_names = list_gcs_files(
                        gcs_hook,
                        params.data_bucket,
                        prefix=gcs_src_file_path)

                elif gcs_src_file_path and filename_prefix:
                    task_entry = {
                        "system": system,
                        "dag_param_file_nm": dag_param_file_nm,
                        "task_param_file_nm": task_param_file_nm,
                        "task_id": f"{gcs_src_file_path}{filename_prefix}",
                        "src_list": [],
                        "cdf_pipeline_name": cdf_pipeline_name,
                        "orchestrator_dag_run_id": dag_run_id_det
                    }

                    file_names = list_gcs_files(
                        gcs_hook,
                        params.data_bucket,
                        prefix=f"{gcs_src_file_path}{filename_prefix}"
                        )

                # Remove folder names from the list and retain only files
                for file_name in file_names:
                    logging.debug("Looking for file names")

                    if file_name != f"{gcs_src_file_path}{filename_prefix}":
                        if not file_name.endswith("/"):
                            task_entry["src_list"].append({
                                "gcp_project_id.target_dataset": \
                                    f"{params.gcp_project_id}.{params.target_dataset}", # pylint: disable=line-too-long
                                "src_file_name": file_name
                            })
                if len(task_entry["src_list"])>0:
                    source_list.append(task_entry)

        # Else if Task params file is not present
        else:
            logging.debug("Task params file is not provided.")
            # Read value of {gcs_src_file_path} variable
            # and generate the list of files present in that folder
            file_names = list_gcs_files(
                gcs_hook,
                params.data_bucket,
                prefix=params.gcs_src_file_path)

            task_entry = {
                "system": system,
                "dag_param_file_nm": dag_param_file_nm,
                "task_param_file_nm": task_param_file_nm,
                "task_id": params.gcs_src_file_path,
                "src_list": [],
                "cdf_pipeline_name":"",
                "orchestrator_dag_run_id": dag_run_id_det
            }
            # Remove folder names from the list and retain only files
            for file_name in file_names:
                logging.debug("Looking for file names")
                if not file_name.endswith("/"):
                    task_entry["src_list"].append({
                        "gcp_project_id.target_dataset": \
                            f"{params.gcp_project_id}.{params.target_dataset}", # pylint: disable=line-too-long
                        "src_file_name": file_name
                    })
            if len(task_entry["src_list"])>0:
                source_list.append(task_entry)

    current_dag_run_uuid = str(uuid.uuid4())
    logging.debug(f"dag_run_uuid: {current_dag_run_uuid}")

    if len(source_list)>0:
        source_list_str = json.dumps(source_list)

        logging.debug("printing source list")
        logging.debug(type(source_list))
        logging.debug(source_list)

        logging.debug("printing source list string")
        logging.debug(type(source_list_str))
        logging.debug(source_list_str)
        logging.debug(f"location: {params.location}")

        #Write src_list to file
        src_list_abs_filename = GoogleCloudStorageCustomHook(
            google_cloud_storage_conn_id="google_cloud_storage_default").create_file( # pylint: disable=line-too-long
            bucket=params.composer_bucket,
            filepath=f"data/{system}/{dag_run_id_det}/",
            filename="source_list.json"  ,
            filecontent=source_list_str)

        logging.debug(f"src_list_abs_filename: {src_list_abs_filename}")
        context["ti"].xcom_push(
            key="src_list_abs_filename", value=src_list_abs_filename)
        context["ti"].xcom_push(
            key="system", value=system)
        context["ti"].xcom_push(
            key="param_file_path", value=params.param_file_path)
        context["ti"].xcom_push(
            key="source_type", value=params.source_type)
        context["ti"].xcom_push(
            key="target_dataset", value=params.target_dataset)
        context["ti"].xcom_push(
            key="gcp_project_id", value=params.gcp_project_id)
        context["ti"].xcom_push(
            key="data_bucket", value=params.data_bucket)
        context["ti"].xcom_push(
            key="archival_bucket", value=params.archival_bucket)
        context["ti"].xcom_push(
            key="source_regex", value=params.source_regex)
        context["ti"].xcom_push(
            key="audit_dataset", value=params.audit_dataset)
        context["ti"].xcom_push(
            key="current_dag_run_uuid", value=current_dag_run_uuid)
        context["ti"].xcom_push(
            key="location", value=params.location)
        context["ti"].xcom_push(
            key="composer_bucket", value=params.composer_bucket)
        time.sleep(30)
    else:
        logging.debug("No files found to load")

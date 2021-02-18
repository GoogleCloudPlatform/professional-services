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
This module contains logic to generate Data Fusion
argument files.
function parse_json: Reads a json file
function exec_query: Executes BQ query supplied to it
function generate: main function to be called by
    the DAG to generate the argument files
function get_arguments:
    generates the argument values for applicable arguments
function get_arg_filename:
    generates the name by which argument file should be created
function write_to_file: writes arguments to argument file
"""
import os
import json
import logging

from hooks.custom_gcs_hook import GoogleCloudStorageCustomHook
from dependencies.read_params import ParamReader

user_home = os.path.expanduser("~")

SOURCE_TYPES = {
    "FILE" : "gcs"
}

ARGFILE_KEYS = {
    "gcs" : "gcs_bq_pipeline"
}

# class CDFArgumentGenerator():
    # def __init__(self):
    #     self.system_name=""
    #     self.dag_param_file_nm=""
    #     self.task_param_file_nm=""
    #     self.rp = ParamReader()

def parse_json(filepath):
    """
    Reads contents of a json file
    This is used to read the arg_config.json file
    which has the details of the CDF arguments
    that need to be populated in the argument file
    :param filpath(string):
        absolute path of file to be read
    :return (json) file content
    """
    with open(filepath) as f:
        jsondata = json.load(f)
        return jsondata

def exec_query(client, query_str):
    """
    Executes the BQ query provided in argument
    :param client(google.cloud.bigquery.client.Client):BigQuery client
    :param query_str(string):query to be executed
    :return (google.cloud.bigquery.table.RowIterator) query results
    """
    print(query_str)
    logging.debug(f"runnning query: {query_str}")
    try:
        query_job = client.query(query_str)
        results = query_job.result()
    except:
        logging.error(f"Error running the query: {query_str}")
        raise
    return results

def generate(
    system,
    dag_param_file_nm,
    task_param_file_nm,
    dag_run_id_det,
    **context):
    """
    main function to be called by
    the DAG to generate argument files
    :param system(string): source system name
    :param dag_param_file_nm(string): name of DAG param file
    :param task_param_file_nm(string): name of task param file
    :param dag_run_id_det(string):
        run id of the dag calling the function
    """
    # self.system_name = system
    # self.dag_param_file_nm = dag_param_file_nm
    # self.task_param_file_nm = task_param_file_nm
    param = ParamReader()
    param.read_parameters(system, dag_param_file_nm, task_param_file_nm)
    task_param_entry = None
    #flat files
    if param.source_type in SOURCE_TYPES["FILE"]:
        if param.task_params:
            for task_param_entry in param.task_params:
                gcs_src_file_path=task_param_entry.get("gcs_src_file_path")
                filename_prefix = task_param_entry.get("filename_prefix")
                task_id = ""
                input_path = ""
                if gcs_src_file_path and (not filename_prefix):
                    task_id = f"{gcs_src_file_path}"
                    input_path = f"{gcs_src_file_path}"
                elif gcs_src_file_path and filename_prefix:
                    task_id = f"{gcs_src_file_path}{filename_prefix}"
                    input_path = f"{gcs_src_file_path}{filename_prefix}*"

                arg_generated = get_arguments(
                    param,
                    task_param_entry,
                    input_path)
                logging.debug(
                    f"argument file content generated for "
                    f"{task_param_entry}: {arg_generated}")

                filename = get_arg_filename(task_id)

                # pylint: disable=line-too-long
                cdf_arg_abs_filename = GoogleCloudStorageCustomHook(
                    google_cloud_storage_conn_id="google_cloud_storage_default").create_file(
                    bucket=param.composer_bucket,
                    filepath=f"data/{system}/{dag_run_id_det}/",
                    filename=filename,
                    filecontent=json.dumps(arg_generated))
                # pylint: enable=line-too-long

                logging.debug(
                    f"argument file created: {cdf_arg_abs_filename}")
        else:
            logging.error("task param required")

def get_arguments(param,task=None,input_path=None):
    """
    Generates the arguments to be written to argument file
    based on arg_config.json
    :param read_params(ReadParameters): instance of ReadParameters
    :param dag_run_id(string): DAG run id generated by Airflow
    :param task(dict): a dict from ReadParameters.task_params[]
    :param input_path(string): input path from dict in task_paramter file
    :return arg_generated(dict): content to be written to the  argument file
    """
    argument_mappings = parse_json(
        f"{param.param_file_path}/arg_config_map.json")
    arguments = {}
    arg_values = {}

    arg_values = argument_mappings[ARGFILE_KEYS.get(
        param.source_type)]
    for key, val in arg_values.items():
        arguments[key] = param.get(val["param"]) \
            if param.get(val["param"]) is not None \
                else val["default"]

        if key == "input_path":
            path = "gs://" + param.data_bucket + "/" + input_path
            arguments[key] = path

        if key == "delimiter" and task is not None:
            arguments[key] = task["delimiter"]
        elif key == "delimiter" and task is None:
            arguments[key] = param.get("delimiter")

        if key == "target_truncateflag" and task is not None:
            arguments[key] = bool(task["load_type"] == "truncate")
        elif key == "target_truncateflag"  \
            and task is None \
                and param.get("dag_load_type") is not None:
            arguments[key] = bool(
                param.get("dag_load_type") == "truncate")

        if key == "target_operation" and \
            task is not None and task["load_type"] is not None:
            arguments[key] = task["load_type"]
        elif key == "target_operation" and \
            task is None and \
                param.get("dag_load_type") is not None:
            arguments[key] = param.get("dag_load_type")

    arg_generated = {}
    arg_generated = arguments
    return arg_generated

def get_arg_filename(task_id):
    """
    Generates name of the argument file to be generated
    based on the input task id
    :param task_id(string):
        task id as generated in the source_list.json temp file
    :return argument_file_name(string):
        name of the argument file
    """
    task_id = task_id.replace("/", "_")#.replace("&","_")
    if task_id.endswith("_"):
        task_id = task_id[0:-1]
    return f"{task_id}.json"
    
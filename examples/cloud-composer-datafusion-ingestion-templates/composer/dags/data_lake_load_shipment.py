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
""" This is a sample worker DAG triggered by the
    orchestrator DAG to load files from GCS to a
    data lake on BigQuery using Cloud Data Fusion.
    Steps perforemd:
    Receive the payload provided by the orchestrator
    Load data into BigQuery
    Apply data dictionary (column descriptions) to tables
    Create or Refresh authorized views
    Archive data files and temp files
    Perform audit logging into a custom table for each step
"""

import datetime
import logging
import os

from airflow import DAG
from airflow.models import Variable
from airflow.operators.python_operator import PythonOperator
# from airflow.providers.google.cloud.operators.datafusion \
# import CloudDataFusionStartPipelineOperator

from operators.bq_audit_operator import BqAuditInsertOperator
from operators.datafusion_operator import CustomCloudDataFusionStartPipelineOperator
from dependencies.read_params import ParamReader
from dependencies.update_metadata import metadata_update
from dependencies.authorised_views import create_views
from dependencies.archive import archive
######################################################################
logging.basicConfig(level=os.environ.get("LOGLEVEL", "DEBUG"))
######################################################################

######################################################################
# Initialize variables
######################################################################
# Variable system is used to provide the name of the source system
# for which the data load is being performed
# This is used to generate convention based object names such as
# dag name, param file names, temp folder and argument files names
# ~~~~~~~~~
# ~~~~~~~~~
# IMPORTANT: TO DO for Developers: Replace this value with a system
# name of your choosing.
# If you change the system name, read README file section
# "Customizing the solution for your requirements"
# to ensure all associated changes are made
# ~~~~~~~~~
# ~~~~~~~~~
######################################################################
default_args = {
    "owner": "airflow",
    "depends_on_past": False,
    "start_date": datetime.datetime(2019, 10, 1, 1, 1, 1, 0),
    "email_on_retry": False,
}
system = "shipment"

dag_name = "load_"+system
dag_param_file_nm = dag_name + "_dag_param.json"
task_param_file_nm = dag_name + "_task_param.json"

def get_payload(
    param_reader,
    **context):

    dag_run = context["dag_run"]
    payload = dag_run.conf
    print(payload)
    print(type(payload))

    # param = ParamReader()
    param_reader.read_parameters(
        payload["system"],
        payload["dag_param_file_nm"],
        payload["task_param_file_nm"])

    context["ti"].xcom_push(
        key="orchestrator_dag_run_id",value=payload["orchestrator_dag_run_id"])
    context["ti"].xcom_push(
        key="source_list", value=payload["src_list"])
    context["ti"].xcom_push(
        key="system", value=payload["system"])
    context["ti"].xcom_push(
        key="source_type", value=param_reader.source_type)
    context["ti"].xcom_push(
        key="param_file_path", value=param_reader.param_file_path)
    context["ti"].xcom_push(
        key="location", value=param_reader.location)
    context["ti"].xcom_push(
        key="arg_file_name",
        value=payload["task_id"].rstrip("/").replace("/","_")+".json")
    context["ti"].xcom_push(
        key="target_dataset", value=param_reader.target_dataset)
    context["ti"].xcom_push(
        key="gcp_project_id", value=param_reader.gcp_project_id)
    context["ti"].xcom_push(
        key="data_bucket", value=param_reader.data_bucket)
    context["ti"].xcom_push(
        key="composer_bucket", value=param_reader.composer_bucket)
    context["ti"].xcom_push(
        key="source_regex", value=param_reader.source_regex)
    context["ti"].xcom_push(
        key="audit_dataset", value=param_reader.audit_dataset)
    context["ti"].xcom_push(
        key="cdf_pipeline_name", value=payload["cdf_pipeline_name"])
    context["ti"].xcom_push(
        key="archival_bucket", value=param_reader.archival_bucket)

    cdf_arg_abs_filename = \
        "data/"+system+"/"+payload["orchestrator_dag_run_id"]+"/"+\
            payload["task_id"].rstrip("/").replace("/","_")+".json"

    context["ti"].xcom_push(
        key="cdf_arg_abs_filename", value=cdf_arg_abs_filename)

    src_list_abs_filename = \
        "data/"+system+"/"+payload["orchestrator_dag_run_id"]+\
            "/source_list.json"

    context["ti"].xcom_push(
        key="src_list_abs_filename", value=src_list_abs_filename)


with DAG(
    f"load_{system}",
    default_args=default_args,
    catchup=False,
    schedule_interval=None
) as dag:

    params = ParamReader()

    t_payload = PythonOperator(
        task_id="get_payload",
        python_callable=get_payload,
        provide_context=True,
        op_kwargs={"param_reader":params}
        )

    insert_audit = BqAuditInsertOperator(
        task_id="insert_audit_entries",
        provide_context=True,
        trigger_rule="all_done",
        env_param_file_name = Variable.get("env_param"),
        xcom_sourcelist_taskid = "get_payload",
        xcom_sourcelist_key = "source_list",
        stage="ingestion process started",
        prev_task_id = "get_payload"
        )

    params.read_parameters(
        system, dag_param_file_nm, task_param_file_nm)

    # pylint: disable=line-too-long
    load_data = CustomCloudDataFusionStartPipelineOperator(
        task_id="execute_DataFusion_pipeline",
        pipeline_name = "{{ ti.xcom_pull(task_ids='get_payload', key='cdf_pipeline_name') }}", 
        instance_name = params.cdf_instance_name,
        location = "australia-southeast1",
        namespace = "default",
        success_states=["COMPLETED"],
        pipeline_timeout =  params.cdf_pipeline_timeout,
        orchestrator_dag_run_id= "{{ ti.xcom_pull(task_ids='get_payload', key='orchestrator_dag_run_id') }}".strip(),
        arg_file_name = "{{ ti.xcom_pull(task_ids='get_payload', key='cdf_arg_abs_filename') }}",
        composer_bucket = "{{ ti.xcom_pull(task_ids='get_payload', key='composer_bucket') }}",
        provide_context=True
        )
    # pylint: enable=line-too-long
    insert_audit_data_load = BqAuditInsertOperator(
        task_id="insert_audit_data_load",
        provide_context=True,
        trigger_rule="all_done",
        env_param_file_name = Variable.get("env_param"),
        xcom_sourcelist_taskid = "get_payload",
        xcom_sourcelist_key = "source_list",
        stage="load data into BQ",
        prev_task_id = "execute_DataFusion_pipeline"
        )

    update_metadata = PythonOperator(
        task_id="apply_datadictionary",
        python_callable=metadata_update,
        provide_context=True,
        trigger_rule="all_success",
        op_kwargs={"dag_run_id_det":"{{ run_id }}".strip(),
        "execute_update_flag":params.update_metadata}
        )

    insert_audit_metadata_update = BqAuditInsertOperator(
        task_id="insert_audit_datadictionary_update",
        provide_context=True,
        trigger_rule="all_done",
        env_param_file_name = Variable.get("env_param"),
        xcom_sourcelist_taskid = "get_payload",
        xcom_sourcelist_key = "source_list",
        stage="apply data dictionary to tables",
        prev_task_id = "apply_datadictionary"
        )

    refresh_auth_views = PythonOperator(
        task_id="generate_auth_views",
        python_callable=create_views,
        provide_context=True,
        trigger_rule="all_success",
        op_kwargs={
            "refresh_authorized_views_flag":params.refresh_authorized_views}
        )

    insert_audit_auth_view_refresh = BqAuditInsertOperator(
        task_id="insert_audit_view_generation",
        provide_context=True,
        trigger_rule="all_done",
        env_param_file_name = Variable.get("env_param"),
        xcom_sourcelist_taskid = "get_payload",
        xcom_sourcelist_key = "source_list",
        stage="generate views",
        prev_task_id = "generate_auth_views"
        )

    archive_processed_files = PythonOperator(
        task_id = "archive_files",
        python_callable = archive,
        trigger_rule="all_success",
        provide_context=True,
        op_kwargs={"dag_run_id_det":"{{ run_id }}".strip()}
        )

    t_payload >> insert_audit >> load_data >> insert_audit_data_load
    insert_audit_data_load >> update_metadata
    update_metadata >> insert_audit_metadata_update >> refresh_auth_views
    refresh_auth_views >> insert_audit_auth_view_refresh
    insert_audit_auth_view_refresh >> archive_processed_files
    
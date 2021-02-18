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
"""Sample orchestrator DAG to load GCS files from GCS to a data lake on
    BigQuery using Cloud Data Fusion.
    Steps included:
    Create inventory of files available on GCS
    Generate argument files for Data Fusion reusable pipelines
    Trigger worker DAG to load data into BigQuery
"""

import datetime
import logging
import os
from airflow import DAG

from airflow.operators.dummy_operator import DummyOperator
from airflow.operators.python_operator import PythonOperator
from airflow.operators.python_operator import BranchPythonOperator
from operators.multi_dag import MultiDagRunOperator
from dependencies.read_params import ParamReader
from dependencies.get_source_list import get_source_list
from dependencies.branch_decision import get_branch
from dependencies.gen_arg_file import generate

######################################################################
logging.basicConfig(level=os.environ.get("LOGLEVEL", "DEBUG"))
######################################################################
# Initialize variables
######################################################################
# Variable system is used to provide the name of the source system
# for which the data load is being performed
# This is used to generate convention based object names such as
# dag name, param file names, temp folder and argument files names
# ~~~~~~~~~
# ~~~~~~~~~
# IMPORTANT: TO DO for Developers: 
# Replace this value with a system name of your choosing.
# If you change the system name, read README file section
# "Customizing the solution for your requirements"
# to ensure all associated changes are made
# ~~~~~~~~~
# ~~~~~~~~~
######################################################################

system = "shipment"
dag_name = "load_"+system+"_orchestrator"

dag_param_file_nm = "load_"+system + "_dag_param.json"
task_param_file_nm = "load_"+system + "_task_param.json"

default_args = {
    "owner": "airflow",
    "depends_on_past": False,
    "start_date": datetime.datetime(2019, 10, 1, 1, 1, 1, 0),
    "email_on_retry": False,
}

######################################################################
# Define function to setup DAG instances
######################################################################
def setup_dags(context, dag_run_obj, invocation_arg):
    dag_run_obj.payload = invocation_arg
    logging.info(f"setup dag with {invocation_arg}")
    return dag_run_obj

######################################################################
# DAG Construct#
######################################################################
with DAG(
    dag_name, default_args=default_args, catchup=False, schedule_interval=None
) as dag:

    logging.debug("Collating source list")

    get_source_list = PythonOperator(
        task_id="get_file_inventory",
        python_callable=get_source_list,
        provide_context=True,
        trigger_rule="all_success",
        op_kwargs={
            "system":system,
            "dag_param_file_nm":dag_param_file_nm,
            "task_param_file_nm":task_param_file_nm,
            "dag_run_id_det":dag_name+"_"+"{{ run_id }}".strip()}
            )

    branch_op = BranchPythonOperator(
        task_id="branch",
        provide_context=True,
        python_callable=get_branch
        )

    generate_arg_files = PythonOperator(
        task_id="generate_cdf_argument_files",
        python_callable=generate,
        provide_context=True,
        trigger_rule="all_success",
        op_kwargs={
            "system":system,
            "dag_param_file_nm":dag_param_file_nm,
            "task_param_file_nm":task_param_file_nm,
            "dag_run_id_det":dag_name+"_"+"{{ run_id }}".strip()}
            )

    params = ParamReader()
    params.read_parameters(system, dag_param_file_nm, task_param_file_nm)

    trigger_load_dags = MultiDagRunOperator(
        task_id="run_load",
        trigger_dag_id=f"load_{system}",
        python_callable=setup_dags,
        trigger_rule="all_success",
        instance_args="{{ ti.xcom_pull(task_ids='get_file_inventory', key='src_list_abs_filename') }}", # pylint: disable=line-too-long
        composer_bucket=params.composer_bucket,
        invoking_dag = dag_name,
        invoking_dag_run_ts = "{{ ts }}",
        provide_context=True
        )

    stop_process = DummyOperator(
        task_id="no_files_to_process",
        dag=dag)

    get_source_list >> branch_op >> [generate_arg_files, stop_process]
    generate_arg_files >> trigger_load_dags

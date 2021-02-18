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
"""Custom operator for inserting Audit entries into BQ Audit table"""
import json
import datetime
import logging
# from datetime import datetime
from airflow import AirflowException
from airflow.models import TaskInstance
from airflow.models import BaseOperator

from google.cloud import bigquery
# from hooks.custom_gcs_hook import GoogleCloudStorageCustomHook

class BqAuditInsertOperator(BaseOperator):
    """
    Class for streaming insertion of Audit entries into BQ table
    Args:
        env_param_file_name(string):
            location of environment parameter
        xcom_sourcelist_taskid (string):
            task id where xcom info for source list is
        xcom_sourcelist_key (string):
            key where xcom info for source list is
        stage (string):
            step in the DAG for which entry is being logged
        status (string):
            status to be logged for the stage
    """
    template_fields = (
        "env_param_file_name",
        "xcom_sourcelist_taskid",
        "xcom_sourcelist_key",
        "stage"
    )

    # @apply_defaults
    def __init__(
        self,
        *args,
        env_param_file_name="",
        xcom_sourcelist_taskid=None,
        xcom_sourcelist_key=None,
        stage=None,
        prev_task_id=None,
        **kwargs
    ):
        super().__init__(*args, **kwargs)

        self.env_param_file_name = env_param_file_name
        self.xcom_sourcelist_taskid = xcom_sourcelist_taskid
        self.xcom_sourcelist_key = xcom_sourcelist_key
        self.stage = stage
        self.prev_task_id = prev_task_id

    def execute(self, context):

        self.log.debug(f"env_param_file_name: {self.env_param_file_name}")

        with open(self.env_param_file_name) as fd_env:
            env_param = json.load(fd_env)

        gcp_project_id = env_param["gcp_project_id"]
        # env_name =  env_param["env_name"]
        # if env_name in ("dev","test"):
        #     audit_dataset = env_param["audit_dataset"]+"_"+env_name
        # else:
        #     audit_dataset = env_param["audit_dataset"]
        audit_dataset = env_param["audit_dataset"]

        dag_run = context["dag_run"]

        source_list = context["ti"].xcom_pull(
            task_ids=self.xcom_sourcelist_taskid, key=self.xcom_sourcelist_key)

        client = bigquery.Client()
        audit_rows = []
        self.log.debug(f"""Following audit_row entries will be streamed
            into {gcp_project_id}.{audit_dataset}.load_audit""")

        dag_exec_ts = dag_run.start_date.strftime("%Y-%m-%d %H:%M:%S")
        dag_instance = context["dag"]
        execution_date = context["execution_date"]

        for source in source_list:
            current_timestamp = datetime.datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S")

            operator_instance = dag_instance.get_task(self.prev_task_id)
            status = TaskInstance(
                operator_instance, execution_date).current_state()
            logging.info(f"task status : {status}")

            audit_row = {"dag_name": dag_run.dag_id,\
                "dag_run_id_detail":dag_run.run_id,\
                    "source_name":source["src_file_name"],\
                            "stage":self.stage,\
                                "status": status,\
                                    "dag_exec_ts":dag_exec_ts,\
                                        "task_end_ts":current_timestamp,\
                                            "log_insert_ts":current_timestamp}

            self.log.debug(audit_row)
            audit_rows.append(audit_row)

        logging.debug(
            f"Streaming audit_row(s) into "
            f"{gcp_project_id}.{audit_dataset}.load_audit")

        errors = client.insert_rows_json(
            f"{gcp_project_id}.{audit_dataset}.load_audit", audit_rows)
        if errors == []:
            self.log.debug(
                "New audit rows have been "
                "inserted into the table.")
        else:
            raise AirflowException(
        f"Encountered errors while streaming "
        f"rows into audit table: {errors}")
        
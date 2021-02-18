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
Custom operator to trigger one or more instances
of another DAG based on arguments provided
by the invoking DAG
"""
import re
import json
from airflow.api.common.experimental.trigger_dag import trigger_dag
from airflow.operators.dagrun_operator import TriggerDagRunOperator
from airflow.operators.dagrun_operator import DagRunOrder
from airflow.utils import timezone

from hooks.custom_gcs_hook import GoogleCloudStorageCustomHook

class MultiDagRunOperator(TriggerDagRunOperator):
    """
    Triggers multiple instances of a DAG run for a specified ``dag_id``

    :param trigger_dag_id: the dag_id to trigger (templated)
    :type trigger_dag_id: str
    :type instance_args: list. the execute method will invoke
        python callable dagrun for each item in this list
    :param python_callable: a reference to a python function that will be
        called while passing it the ``context`` object a placeholder
        object ``obj`` for your callable to fill and a ``invocation_item``
        from the ``invocation_args`` list.
        return the updated ``obj`` if you want
        a DagRun created. This ``obj`` object contains a ``run_id`` and
        ``payload`` attribute that you can modify in your function.
        The ``run_id`` should be a unique identifier for that DAG run, and
        the payload has to be a picklable object that will be made available
        to your tasks while executing that DAG run. Your function header
        should look like ``def foo(context, dag_run_obj):``
    :type python_callable: python callable
    :param execution_date: Execution date for the dag (templated)
    :type execution_date: str or datetime.datetime
    """

    template_fields = ("trigger_dag_id", "execution_date", "instance_args")
    ui_color = "#ffefeb"

    def __init__(
        self,
        trigger_dag_id="",
        instance_args=None,
        composer_bucket=None,
        invoking_dag=None,
        invoking_dag_run_ts=None,
        python_callable=None,
        execution_date=None,
        *args,
        **kwargs,
    ):
        super().__init__(
            trigger_dag_id=trigger_dag_id,
            python_callable=python_callable,
            execution_date=execution_date,
            *args,
            **kwargs,
        )
        self.instance_args = instance_args
        self.composer_bucket = composer_bucket
        self.invoking_dag = invoking_dag
        self.invoking_dag_run_ts = invoking_dag_run_ts
        self.log.debug(
            f"MultiDagRunOperator inited with a list "
            f"of items from file {self.instance_args}"
        )

    def execute(self, context):

        source_list = GoogleCloudStorageCustomHook(
            google_cloud_storage_conn_id="google_cloud_storage_default"
            ).read_file(
                bucket=self.composer_bucket,
                abs_file_path=self.instance_args)

        self.log.debug(f"source_list is of type {type(source_list)}")

        # just in case the instance arg is not a list
        if isinstance(source_list, str):
            source_list = json.loads(source_list)
        if not isinstance(source_list, list):
            self.log.error("Instance Args must be a list")
            return

        self.log.info(
            f"MultiDagRunOperator executing with "
            f"a list of {len(source_list)} items"
        )
        for idx, invocation_item in enumerate(source_list):
            task_id_run_id = invocation_item["task_id"]

            if self.execution_date is not None:
                self.execution_date = timezone.parse(self.execution_date)
                run_id = "trig__{}-{}".format(self.execution_date, idx)
            else:
                run_id = self.invoking_dag+"_"+\
                    task_id_run_id.replace("/","_") +\
                        "_"+timezone.utcnow().isoformat()
                run_id = re.sub("[^0-9a-zA-Z_]+", "_", run_id)
            dro = DagRunOrder(run_id=run_id)
            if self.python_callable is not None:
                dro = self.python_callable(context, dro, invocation_item)
            if dro:
                self.log.debug("invoking")
                trigger_dag(
                    dag_id=self.trigger_dag_id,
                    run_id=dro.run_id,
                    conf=json.dumps(dro.payload),
                    execution_date=self.execution_date,
                    replace_microseconds=False,
                )
            else:
                self.log.debug("Criteria not met, moving on")
                
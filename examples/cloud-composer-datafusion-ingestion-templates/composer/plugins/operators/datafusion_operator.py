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
Custom operator based on CloudDataFusionStartPipelineOperator
Triggers data fusion pipeline based on a indicator/conditional flag
This operator is written to ensure Data Fusion pipeline
corresponding to the airflow task is triggered
only if source files exist on GCS.
Data Fusion pipeline triggered when no files are available results
in pipeline failure and this custom operator
is written to avoid that scenario.
"""
import logging
from airflow.providers.google.cloud.operators.datafusion import CloudDataFusionStartPipelineOperator
from hooks.custom_gcs_hook import GoogleCloudStorageCustomHook

class CustomCloudDataFusionStartPipelineOperator(
    CloudDataFusionStartPipelineOperator
    ):
    """
    Arguments added to the custom operator
    :param abs_source_list_path(string):
        absolute file name of source_list.json
        which contains the file inventory
    """
    template_fields = (
        "pipeline_name",
        "orchestrator_dag_run_id",
        "arg_file_name",
        "composer_bucket"
    )

    # @apply_defaults
    def __init__(
        self,
        task_id,
        pipeline_name,
        instance_name,
        location,
        namespace,
        success_states,
        pipeline_timeout,
        orchestrator_dag_run_id,
        arg_file_name,
        composer_bucket,
        *args,
        **kwargs
        ):
        self.task_id=task_id
        self.pipeline_name=pipeline_name
        self.instance_name=instance_name
        self.location=location
        self.namespace=namespace
        self.success_states=success_states
        self.pipeline_timeout=pipeline_timeout
        self.orchestrator_dag_run_id=orchestrator_dag_run_id
        self.arg_file_name=arg_file_name
        self.composer_bucket=composer_bucket

        super().__init__(
            task_id = task_id,
            pipeline_name = pipeline_name,
            instance_name = instance_name,
            success_states = success_states,
            pipeline_timeout = pipeline_timeout,
            location = location,
            runtime_args = None,
            namespace = namespace,
            *args,
            **kwargs)

    def execute(self,context):
        cdf_arg_abs_filename =\
            context["ti"].xcom_pull(
                task_ids="get_payload", key="cdf_arg_abs_filename")

        self.runtime_args = GoogleCloudStorageCustomHook(
            google_cloud_storage_conn_id=\
                "google_cloud_storage_default").read_file(
                bucket=self.composer_bucket,
                abs_file_path=cdf_arg_abs_filename)

        logging.debug(
            f"Starting pipeline {self.pipeline_name} "
            f"with following runtime arguments:")
        logging.debug(self.runtime_args)

        super().execute(context)

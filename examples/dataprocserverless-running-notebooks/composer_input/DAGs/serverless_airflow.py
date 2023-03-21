# Copyright 2023 Google Inc. All Rights Reserved.
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
This orchestrates the workflow of running Jupyter Notebooks via PySpark job on a Dataproc cluser

This DAG relies on two Airflow variables
https://airflow.apache.org/concepts.html#variables
* gcp_project - Google Cloud Project to use for the Cloud Dataproc cluster.
* gce_zone - Google Compute Engine zone where Cloud Dataproc cluster should be
  created.
"""

import datetime
import uuid

from airflow import models
from airflow.models import Variable
from airflow.utils import trigger_rule
from airflow.providers.google.cloud.operators.dataproc import DataprocCreateBatchOperator

yesterday = datetime.datetime.combine(
    datetime.datetime.today() - datetime.timedelta(1),
    datetime.datetime.min.time())
default_dag_args = {
    # Setting start date as yesterday starts the DAG immediately when it is
    # detected in the Cloud Storage bucket.
    'start_date': yesterday,
    # To email on failure or retry set 'email' arg to your email and enable
    # emailing here.
    'email_on_failure': False,
    'email_on_retry': False,
    # If a task fails, retry it once after waiting at least 5 minutes
    'retries': 1,
    'retry_delay': datetime.timedelta(minutes=5),
}
gcp_project = Variable.get('gcp_project')
gcs_bucket =Variable.get('gcs_bucket')
phs_region = Variable.get('phs_region')
phs = Variable.get('phs')

# Arguments to pass to Cloud Dataproc job.
# EDIT: input_notebook path, output_notebook path, 
input_notebook = f"gs://{gcs_bucket}/dataproc_serverless/notebooks/jupyter/spark_notebook.ipynb"
output_notebook = f"gs://{gcs_bucket}/dataproc_serverless/notebooks/jupyter/output/spark_notebook_output.ipynb"
notebook_args= [input_notebook, output_notebook]

BATCH_CONFIG= {
    "pyspark_batch": {
        "main_python_file_uri": f"gs://{gcs_bucket}/dataproc_serverless/composer_input/jobs/wrapper_papermill.py",
        "args": notebook_args,},
            "environment_config": {
                "peripherals_config": {
                    "spark_history_server_config": {
                        "dataproc_cluster": f"projects/{gcp_project}/regions/{phs_region}/clusters/{phs}",
                    },
                },
            },
        }

with models.DAG(
        'dataproc_serverless',
        # Continue to run DAG once per day
        schedule_interval=datetime.timedelta(days=1),
        default_args=default_dag_args) as dag:

    create_batch1 = DataprocCreateBatchOperator(
        task_id="serverless-notebook1",
        batch=BATCH_CONFIG,
        region="us-central1",
        batch_id="batch-id-" + str(uuid.uuid1()),
        retry= None 
    )
    create_batch2 = DataprocCreateBatchOperator(
        task_id="serverless-notebook2",
        batch=BATCH_CONFIG,
        region="us-central1",
        batch_id="batch-id-" + str(uuid.uuid1()),
        retry= None 
    )
    create_batch3 = DataprocCreateBatchOperator(
        task_id="serverless_notebook3",
        batch=BATCH_CONFIG,
        region="us-central1",
        batch_id="batch-id-" + str(uuid.uuid1()),
        retry= None
    )
    create_batch4 = DataprocCreateBatchOperator(
        task_id="serverless_notebook4",
        batch=BATCH_CONFIG,
        region="us-central1",
        batch_id="batch-id-" + str(uuid.uuid1()),
        retry= None
    )

    # [START composer_hadoop_steps]
    create_batch1 >> create_batch2 >> create_batch3 >> create_batch4

# Copyright 2021 Google LLC. All rights reserved. Licensed under the Apache
# License, Version 2.0 (the "License"); you may not use this file except in
# compliance with the License. You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations under
# the License.
#
# Any software provided by Google hereunder is distributed "AS IS", WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, and is not intended for production use

"""
A DAG that runs and tests a Dockerized dbt project on Kubernetes.
Developed for Composer version 1.17.0. Airflow version 2.1.2
"""

import datetime
import json
import logging as log
import os

from airflow import models
from airflow.operators.python_operator import PythonOperator
from airflow.models import Variable

from airflow.kubernetes.secret import Secret
from airflow.providers.cncf.kubernetes.operators.kubernetes_pod import KubernetesPodOperator


# Airflow macro - Execution date
ds = '{{ ds }}'

default_args = {
    'depends_on_past': False,
    'start_date': datetime.datetime(2016, 1, 1),
    'end_date': datetime.datetime(2016, 1, 3),
    'retries': 0
}

# Scheduled for running daily
with models.DAG(
    dag_id='run_dbt_on_kubernetes_optimized',
    schedule_interval= "0 0 * * *",
    default_args=default_args,
) as dag:
    env = os.getenv("ENV", "dev")
    project = os.getenv("GCP_PROJECT")
    
    
    def get_args(model, execution_date):
        """The function will return the dbt arguments. This function should be called from an operator to get the execution date from Airflow macros"""

        default_dbt_vars = {
                "project_id": project,
                "bigquery_location": Variable.get("bigquery_location"),
                "key_file_dir": '/var/secrets/google/key.json',
                "execution_date": execution_date
            }

        default_dbt_args = {
            # Setting the dbt variables
            "--vars": default_dbt_vars,
            # Define which target to load
            "--target": env,
            # Which directory to look in for the profiles.yml file.
            "--profiles-dir": ".dbt",
            # Which model to run
            "--models": model
        }

        # This logic will convert the key value pair object into list
        dbt_cli_args = []
        for key, value in default_dbt_args.items():
            if value is not None:
                dbt_cli_args.append(key)

                if isinstance(value, (list, dict)):
                    value = json.dumps(value)
                dbt_cli_args.append(value)

        return dbt_cli_args

    # Reference the Kubernetes secret that holds dbt's service account JSON
    secret_volume = Secret(
        deploy_type='volume',
        deploy_target='/var/secrets/google',
        secret='dbt-sa-secret',
        key='key.json'
    )

    # Select and use the correct Docker image from the private GCR
    image = 'gcr.io/{project}/dbt-builder:latest'.format(
        project=project
    )

    def run_dbt_on_kubernetes(**kwargs):
        cmd = kwargs['cmd']
        model = kwargs['model']
        execution_date = kwargs['execution_date']

        dbt_args = get_args(model, execution_date)

        # with this, the dbt will store the failed records from test step to BigQuery table
        if cmd == "test":
            store_test_result = "--store-failures"
            dbt_args.append(store_test_result)

        id = 'dbt_cli_{}_{}'.format(cmd, execution_date)
        KubernetesPodOperator(
            task_id=id,
            name=id,
            image_pull_policy='Always',
            arguments=[cmd] + dbt_args,
            namespace='default',
            get_logs=True,  # Capture logs from the pod
            log_events_on_failure=True,  # Capture and log events in case of pod failure
            is_delete_operator_pod=True, # This is required to prevent Airflow tasks clash on manual retry
            image=image,
            secrets=[secret_volume]  # Set Kubernetes secret reference to dbt's service account JSON
        ).execute(kwargs)

    # RAW
    dbt_run_raw = PythonOperator(
        task_id='dbt_run_raw',
        provide_context=True,
        python_callable=run_dbt_on_kubernetes,
        op_kwargs={"cmd": "run", "execution_date": ds,"model":"raw"}
    )

    dbt_test_raw = PythonOperator(
        task_id='dbt_test_raw',
        provide_context=True,
        python_callable=run_dbt_on_kubernetes,
        op_kwargs={"cmd": "test", "execution_date": ds, "model":"raw"}
    )

    # INTERMEDIATE
    dbt_run_intermediate = PythonOperator(
        task_id='dbt_run_intermediate',
        provide_context=True,
        python_callable=run_dbt_on_kubernetes,
        op_kwargs={"cmd": "run", "execution_date": ds, "model":"intermediate"}
    )

    dbt_test_intermediate = PythonOperator(
        task_id='dbt_test_intermediate',
        provide_context=True,
        python_callable=run_dbt_on_kubernetes,
        op_kwargs={"cmd": "test", "execution_date": ds, "model":"intermediate"}
    )

    # DATAMART
    dbt_run_datamart = PythonOperator(
        task_id='dbt_run_datamart',
        provide_context=True,
        python_callable=run_dbt_on_kubernetes,
        op_kwargs={"cmd": "run", "execution_date": ds, "model":"datamart"}
    )

    dbt_test_datamart = PythonOperator(
        task_id='dbt_test_datamart',
        provide_context=True,
        python_callable=run_dbt_on_kubernetes,
        op_kwargs={"cmd": "test", "execution_date": ds, "model":"datamart"}
    )

    dbt_run_raw >> dbt_test_raw >> dbt_run_intermediate >> dbt_test_intermediate >> dbt_run_datamart >> dbt_test_datamart

dag.doc_md = __doc__

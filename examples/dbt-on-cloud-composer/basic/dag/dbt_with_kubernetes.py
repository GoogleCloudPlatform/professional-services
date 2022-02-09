# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
A DAG that runs and tests a Dockerized dbt project on Kubernetes.
Developed for Composer version 1.17.0. Airflow version 2.1.2
"""

import datetime
import json
import os

from airflow import models
from airflow.operators.python_operator import PythonOperator
from airflow.models import Variable

from airflow.kubernetes.secret import Secret
from airflow.providers.cncf.kubernetes.operators.kubernetes_pod import KubernetesPodOperator

# The environment variables from Cloud Composer
env = Variable.get("run_environment")
project = os.getenv("GCP_PROJECT")

# Airflow default arguments
default_args = {
    'depends_on_past': False,
    'start_date': datetime.datetime(2016, 1, 1),
    'end_date': datetime.datetime(2016, 1, 3),
    # Make sure to set the catchup to False in this basic example
    # This will prevents multiple dbt runs from the past dates
    'catchup':False,
    'retries': 0
}

# Select and use the correct Docker image from the private Google Cloud Repository (GCR)
IMAGE = 'gcr.io/{project}/dbt-builder-basic:latest'.format(
    project=project,
    env=env
)

# A Secret is an object that contains a small amount of sensitive data such as
# a password, a token, or a key. Such information might otherwise be put in a
# Pod specification or in an image; putting it in a Secret object allows for
# more control over how it is used, and reduces the risk of accidental
# exposure.

secret_volume = Secret(
    deploy_type='volume',
    # Path where we mount the secret as volume
    deploy_target='/var/secrets/google',
    # Name of Kubernetes Secret
    secret='dbt-sa-secret',
    # Key in the form of service account file name
    key='key.json'
)

# dbt default variables
# These variables will be passed into the dbt run
# Any variables defined here, can be used inside dbt

default_dbt_vars = {
        "project_id": project,
        # Example on using Cloud Composer's variable to be passed to dbt
        "bigquery_location": Variable.get("bigquery_location"),
        "key_file_dir": '/var/secrets/google/key.json',
        "source_data_project": Variable.get("source_data_project")
    }

# dbt default arguments
# These arguments will be used for running the dbt command

default_dbt_args = {
    # Setting the dbt variables
    "--vars": default_dbt_vars,
    # Define which target to load
    "--target": env,
    # Which directory to look in for the profiles.yml file.
    "--profiles-dir": ".dbt"
}

# Converting the default_dbt_args into python list
# The python list will be used for the dbt command
# Example output ["--vars","{project_id: project}","--target","remote"]

dbt_cli_args = []
for key, value in default_dbt_args.items():
    dbt_cli_args.append(key)

    if isinstance(value, (list, dict)):
        value = json.dumps(value)
    dbt_cli_args.append(value)

# Define the DAG
with models.DAG(
    dag_id='run_dbt_on_kubernetes',
    schedule_interval= "0 0 * * *",
    default_args=default_args,
) as dag:

    def run_dbt_on_kubernetes(cmd=None, **context):
        """This function will execute the KubernetesPodOperator as an Airflow task"""
        # If running dbt test, we add the store failures parameter.
        # When added, the dbt test will create tables storing the bad records
        if cmd == "test":
            store_test_result = "--store-failures"
            dbt_cli_args.append(store_test_result)

        # Use the KubernetesPodOperator to run the dbt commands
        # Check the documentation for the full parameter details
        # https://cloud.google.com/composer/docs/how-to/using/using-kubernetes-pod-operator#airflow-2
        KubernetesPodOperator(
            task_id='dbt_cli_{}'.format(cmd),
            name='dbt_cli_{}'.format(cmd),
            image_pull_policy='Always',
            arguments=[cmd] + dbt_cli_args,
            namespace='default',
            get_logs=True,  # Capture logs from the pod
            log_events_on_failure=True,  # Capture and log events in case of pod failure
            is_delete_operator_pod=True, # To clean up the pod after runs
            image=IMAGE,
            secrets=[secret_volume]  # Set Kubernetes secret reference to dbt's service account JSON
        ).execute(context)

    # Running the dbt run command
    # https://docs.getdbt.com/reference/commands/run

    dbt_run = PythonOperator(
        task_id='dbt_run',
        provide_context=True,
        python_callable=run_dbt_on_kubernetes,
        op_kwargs={"cmd": "run"}
    )

    # Running the dbt tests command
    # The tests will run after the "dbt run" command
    # In dbt, the tests is not a dry test
    # The tests will check the actual data after loading (data integrity test)
    # https://docs.getdbt.com/reference/commands/test

    dbt_test = PythonOperator(
        task_id='dbt_test',
        provide_context=True,
        python_callable=run_dbt_on_kubernetes,
        op_kwargs={"cmd": "test"}
    )

    dbt_run >> dbt_test

dag.doc_md = __doc__

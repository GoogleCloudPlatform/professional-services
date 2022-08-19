# Copyright 2022 Google LLC All Rights Reserved.
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

from datetime import datetime, timedelta
from airflow.operators.bash import BashOperator
# The DAG object we'll need this to instantiate a DAG
from airflow import DAG


default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email': ['airflow@example.com'],
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=1)
}

# Define DAG: Set ID and assign default args, tags and schedule variables.
with DAG(
    'load_vars_and_execute',
    default_args=default_args,
    description='Load variables and execute DAG',
    schedule_interval=timedelta(days=1),
    start_date=datetime(2021, 1, 1),
    catchup=False,
    is_paused_upon_creation = True,
    tags=['ccm-model'],
) as dag:

    copy_variables_file = BashOperator(
        task_id="copy_variables_file",
        dag=dag,
        bash_command='gsutil cp gs://us-central1-tftest1-64bc2b2a-bucket/variables.json ${AIRFLOW_HOME}/variables.json',
    )

    airflow_command = BashOperator(
        task_id="airflow_command",
        dag=dag,
        bash_command='airflow variables import ${AIRFLOW_HOME}/variables.json',
    )

#TODO: After loading the variables, execute the DAG

copy_variables_file >> airflow_command
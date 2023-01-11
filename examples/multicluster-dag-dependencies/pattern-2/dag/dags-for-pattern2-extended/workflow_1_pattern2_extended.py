# Copyright 2022 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from airflow import DAG
from airflow.operators.bash_operator import BashOperator
from airflow.utils import dates

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': dates.days_ago(2),
    'email_on_failure': False,
    'email_on_retry': False,
}

with DAG(
        'workflow_1_pattern2_extended',
        default_args=default_args,
        schedule_interval='*/5 * * * *',
        catchup=False,
) as dag:

    t1 = BashOperator(task_id='task1', bash_command="echo 'Executing task1..'")

    t2 = BashOperator(task_id='task2', bash_command="sleep 1s")

    t1 >> t2

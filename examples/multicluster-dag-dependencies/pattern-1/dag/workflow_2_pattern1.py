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
import os
from datetime import timedelta

from airflow import DAG
from airflow.contrib.sensors.pubsub_sensor import PubSubPullSensor
from airflow.operators.bash_operator import BashOperator
from airflow.utils import dates

PUBSUB_PROJECT = os.environ['PUBSUB_PROJECT']
SUBSCRIPTION_SUCCESS = 'workflow_1_pattern1-workflow_2_pattern1-on_success'  # Cloud Pub/Sub subscription

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': dates.days_ago(1),
    'email': ['airflow@example.com'],
    'email_on_failure': False,
    'email_on_retry': False,
}


def on_failure_action(context):
    dag_id = context['dag'].dag_id
    task_id = context['task_instance'].task_id
    print(
        f"Error getting pubsub message on dag: {dag_id}, and task_id: {task_id}"
    )


with DAG('workflow_2_pattern1',
         default_args=default_args,
         schedule_interval='*/5 * * * *',
         catchup=False) as dag:

    t1 = PubSubPullSensor(task_id='pull-messages',
                          ack_messages=True,
                          project_id=PUBSUB_PROJECT,
                          subscription=SUBSCRIPTION_SUCCESS,
                          execution_timeout=timedelta(minutes=1),
                          max_messages=1,
                          on_failure_callback=on_failure_action)

    t2 = BashOperator(
        task_id='task2',
        bash_command="echo 'Executing task2 on DAG B Env2 after pubsub msg'")

    t1 >> t2

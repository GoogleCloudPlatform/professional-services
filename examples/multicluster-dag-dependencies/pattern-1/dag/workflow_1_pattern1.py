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
import json
import os

from airflow import DAG
from airflow.contrib.sensors.pubsub_sensor import PubSubPullSensor
from airflow.models import Variable
from airflow.operators.bash_operator import BashOperator
from airflow.utils import dates

PUBSUB_PROJECT = os.environ['PUBSUB_PROJECT']
AIRFLOW_STATUS_TOPIC = os.environ['AIRFLOW_STATUS_TOPIC']


# publish a msg to a ptopic
def publish_pubsub_message(workflow_id, workflow_run_id, workflow_status):
    from google.cloud import pubsub_v1
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(PUBSUB_PROJECT, AIRFLOW_STATUS_TOPIC)
    data = {
        "source_type": "composer",
        "workflow_id": workflow_id,
        "workflow_run_id": workflow_run_id,
        "workflow_status": workflow_status
    }
    payload = json.dumps(data)
    future = publisher.publish(topic_path,
                               payload.encode('utf-8'),
                               source_type="composer",
                               workflow_id=workflow_id,
                               workflow_status=workflow_status)
    print(future.result())
    print(f"Published message with custom attributes to {topic_path}.")


def publish_failure_msg_pubsub(context):
    publish_pubsub_message(context['dag'].dag_id, context['dag_run'].run_id,
                           'on_failure')


def publish_success_msg_pubsub(context):
    publish_pubsub_message(context['dag'].dag_id, context['dag_run'].run_id,
                           'on_success')


default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': dates.days_ago(2),
    'email_on_failure': False,
    'email_on_retry': False,
    'on_failure_callback': publish_failure_msg_pubsub,
}

with DAG(
        'workflow_1_pattern1',
        default_args=default_args,
        schedule_interval='*/5 * * * *',
        catchup=False,
) as dag:

    t1 = BashOperator(task_id='task1', bash_command="echo 'Executing task1..'")

    t2 = BashOperator(task_id='task2', bash_command="sleep 1s")

    t3 = BashOperator(task_id='task3',
                      bash_command="echo 'Executing task3..'",
                      on_success_callback=publish_success_msg_pubsub)

    t1 >> t2 >> t3

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

from datetime import  timedelta
from airflow.utils import dates
from airflow.models import DAG
from airflow.sensors.external_task import ExternalTaskSensor
from airflow.operators.bash_operator import BashOperator
from airflow.contrib.sensors.pubsub_sensor import PubSubPullSensor
from google.cloud import pubsub_v1
import os
import json

PUBSUB_PROJECT = os.environ['PUBSUB_PROJECT']
AIRFLOW_STATUS_TOPIC = os.environ['AIRFLOW_STATUS_TOPIC_P2']


# function to publish a pubsub msg
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
    'email': ['airflow@example.com'],
    'email_on_failure': False,
    'max_active_runs': 1,  # new
    'email_on_retry': False,
    'project': PUBSUB_PROJECT,  #new
    'retry_delay': timedelta(minutes=5),  # new
    'on_failure_callback': publish_failure_msg_pubsub  # new
}

dag = DAG('workflow_3_pattern2_extended',
          schedule_interval='*/5 * * * *',
          default_args=default_args,
          catchup=False)

external_task_sensor = ExternalTaskSensor(task_id='external_task_sensor',
                                          poke_interval=60,
                                          timeout=600,
                                          soft_fail=False,
                                          retries=10,
                                          external_task_id='task2',
                                          external_dag_id='workflow_2_pattern2_extended',
                                          allowed_states=['success'],
                                          dag=dag)

# task that will send the message to pubsub to trigger another DAG/task
task_downstream_another_env = BashOperator(
    task_id='task_downstream_another_env',
    on_success_callback=publish_success_msg_pubsub,
    bash_command=
    "echo 'running task after met condition on the external sensor...'",
    dag=dag)

external_task_sensor >> task_downstream_another_env

# Copyright 2022 Google Inc. All Rights Reserved.
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

from datetime import timedelta, datetime
import json
from airflow.operators.dummy_operator import DummyOperator
from airflow.operators.http_operator import SimpleHttpOperator
from airflow.sensors.http_sensor import HttpSensor
import airflow

default_dag_args = {
    'depends_on_past':
    False,
    'start_date':
    datetime.combine(datetime.today() - timedelta(1), datetime.min.time()),
}


def get_auth_token():
    import google.auth
    import google.auth.transport.requests
    credentials, project_id = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"])
    auth_req = google.auth.transport.requests.Request()
    credentials.refresh(auth_req)
    return credentials.token


# getting request object
with airflow.DAG("Export_Insight_Data_to_BQ",
                 default_args=default_dag_args,
                 max_active_runs=1,
                 catchup=True,
                 user_defined_filters={'fromjson': lambda s: json.loads(s)},
                 schedule_interval="*/15 * * * *") as dag:

    start_task = DummyOperator(task_id="start")

    export_insight_data_to_BQ = SimpleHttpOperator(
        task_id="export_insight_data_to_BQ",
        endpoint=
        'projects/{{ var.json.ccai_dag_config.GCP_PROJECT_ID_FOR_CCAI_INSIGHT }}/locations/us-central1/insightsdata:export',
        method='POST',
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + get_auth_token()
        },
        data=
        "{ big_query_destination: { project_id: '{{ var.json.ccai_dag_config.GCP_PROJECT_ID_FOR_BQ }}', dataset: '{{ var.json.ccai_dag_config.BQ_DATASET }}', table: '{{ var.json.ccai_dag_config.BQ_TABLE }}' },"
        +
        "filter: 'create_time>\"{{ execution_date + macros.timedelta(minutes=-15) }}\" create_time<\"{{ execution_date }}\"'}",
        response_check=lambda response: response.ok,
        http_conn_id='insights_http',
        do_xcom_push=True)

    check_upload_status_to_BQ = HttpSensor(
        task_id="check_upload_status_to_BQ",
        endpoint=
        '{{(task_instance.xcom_pull(task_ids="export_insight_data_to_BQ") | fromjson)["name"]}}',
        method='GET',
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + get_auth_token()
        },
        response_check=lambda response: 'done' in response.json() and bool(
            response.json()['done']),
        poke_interval=5,
        timeout=300,
        http_conn_id='insights_http')

    stop_task = DummyOperator(task_id="stop")

    start_task >> export_insight_data_to_BQ >> check_upload_status_to_BQ >> stop_task

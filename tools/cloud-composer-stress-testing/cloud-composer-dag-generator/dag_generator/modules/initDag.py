# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import datetime
import random


def get_init_dag(dag_number, schedule):
    today = datetime.datetime.now()
    if schedule == "min":
        dag_schedule = "{min} * * * *".format(min=random.randrange(1, 10))
    elif schedule == "hour":
        dag_schedule = "{min} {hour} * * *".format(
            min=random.randrange(0, 59), hour=random.randrange(0, 23)
        )
    elif schedule == "everyhalfhour":
        dag_schedule = "*/30 * * * *"
    elif schedule == "everyhour":
        dag_schedule = "0 * * * *"
    else:
        dag_schedule = "{min} {hour} {day} * *".format(
            min=random.randrange(0, 59),
            hour=random.randrange(0, 23),
            day=random.randrange(1, 28),
        )

    lines = """import time
from datetime import datetime
from airflow.models import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator
from airflow.models.baseoperator import chain

default_args = {{
    'owner': 'Airflow',
    'start_date': datetime({start_year}, {start_month}, {start_day}),
}}

with DAG(
    dag_id='test_dag_{dag_id}',
    schedule_interval='{schedule}',
    default_args=default_args,
    catchup=False
) as dag:
    """.format(
        dag_id=dag_number,
        start_year=today.year,
        schedule=dag_schedule,
        start_month=today.month,
        start_day=today.day,
    )
    return lines

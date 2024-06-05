# Copyright 2024 Google LLC
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


"""Cloud Composer DAG Dependency Management Example."""


import airflow
from datetime import datetime, timedelta
from airflow.operators.dummy_operator import DummyOperator

default_dag_args = {
   "depends_on_past": False,
   "start_date": datetime(2024, 3, 3),
   "retries": 1,
   "retry_delay": timedelta(minutes=30),
}
with airflow.DAG('company_cal_refresh',
                 default_args=default_dag_args,
                 max_active_runs=2,
                 schedule_interval="@yearly",
                 catchup=True
                 ) as dag:
    start_task = DummyOperator(task_id='start')

   

    stop_task = DummyOperator(task_id="stop")

    
    start_task >> stop_task

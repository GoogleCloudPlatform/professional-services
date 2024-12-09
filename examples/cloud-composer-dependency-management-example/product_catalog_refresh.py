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
from airflow.sensors.external_task_sensor import ExternalTaskSensor
# from croniter import croniter -- uncomment these libraries to use if needed
# import pytz -- uncomment these libraries to use if needed

default_dag_args = {
   "depends_on_past": False,
   "start_date": datetime(2024, 3, 3),
   "retries": 1,
   "retry_delay": timedelta(minutes=30),
}

# Define parent task IDs and external DAG IDs
parent_tasks = [
    {"task_id": "parent_task_1", "dag_id": "company_cal_refresh", "schedule_frequency":"yearly"}
]

def execution_delta_dependency(logical_date, **kwargs):
    dt = logical_date
    task_instance_id=str(kwargs['task_instance']).split(':')[1].split(' ')[1].split('.')[1]
    res = None

    for sub in parent_tasks:
        if sub['task_id'] == task_instance_id:
            res = sub
            break

    schedule_frequency=res['schedule_frequency']
    parent_dag_poke = ''
    if schedule_frequency == "monthly":
        parent_dag_poke = dt.replace(day=1).replace(hour=0, minute=0, second=0, microsecond=0)
    elif schedule_frequency == "weekly":
        parent_dag_poke = (dt - timedelta(days=dt.isoweekday() % 7)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif schedule_frequency == "yearly":
        parent_dag_poke = dt.replace(day=1, month=1, hour=0, minute=0, second=0, microsecond=0)
    elif schedule_frequency == "daily":
        parent_dag_poke = (dt).replace(hour=0, minute=0, second=0, microsecond=0)    
    print(parent_dag_poke)
    
    #OPTIONAL : In case your dag frequency does not fall in any of the above options or if you want to test with varying dynamic frequencies 
    # such as 5th minute every hour and so on, consider uncommenting the below code and comment / delete the above code. 
    # the below code uses the croniter library to get the previous execution instance of the dag based on the date and the scheduled frequency 
    
    # iter = croniter(schedule_frequency, dt)
    # prev_instance = iter.get_prev(datetime)
    # parent_dag_poke = pytz.utc.localize(prev_instance)
    # return prev_instance
    
    return parent_dag_poke

with airflow.DAG('product_catalog_refresh',
                 default_args=default_dag_args,
                 max_active_runs=2,
                 schedule_interval="@monthly",
                 catchup=True
                 ) as dag:
    start_task = DummyOperator(task_id='start')

     # Create external task sensors dynamically
    external_task_sensors = []
    for parent_task in parent_tasks:

        external_task_sensor = ExternalTaskSensor(
            task_id=parent_task["task_id"],
            external_dag_id=parent_task["dag_id"],
            timeout=900,
            execution_date_fn=execution_delta_dependency,
            poke_interval=60,  # Check every 60 seconds
            mode="reschedule",  # Reschedule task if external task fails
            check_existence=True
        )
        external_task_sensors.append(external_task_sensor)
    stop_task = DummyOperator(task_id="stop")

    # Uncomment this after fixing the dependency  
    start_task >> external_task_sensors >> stop_task

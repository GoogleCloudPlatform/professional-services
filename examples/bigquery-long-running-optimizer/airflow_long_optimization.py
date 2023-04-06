#    Copyright 2023 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
""" Module to use main_dag as Composer Code """

import datetime
import airflow
from airflow import models
from airflow.models import Variable
from airflow.decorators import task

default_args = {
    'owner': 'Composer Example',
    "start_date": airflow.utils.dates.days_ago(1),
    'depends_on_past': False,
    'retries': 1,
    'retry_delay': datetime.timedelta(minutes=1),
}


bucket_name = Variable.get("gcs_bucket_name_optimization",'bq_long_running_optimization')
input_path = Variable.get("input_folder",'input/')
output_path = Variable.get("output_folder", 'output/')
project_id = Variable.get("project_id","poc-env-aks")
uid_long_running = int(Variable.get("uid_long_running",True))

with models.DAG('BQ-long-running-Optimization', schedule_interval=datetime.timedelta(days=1), default_args=default_args) as dag:

    @task.virtualenv(task_id="bq-Optimization", 
                     requirements=["google-cloud-storage","sqlparser"],
                     system_site_packages=True)
    
    def bq_optimization_callable(bucket_name, input_path, uid_long_running, project_id, output_path):
        from google.cloud import storage
        from optimization.main_dag import run_optimization
        from airflow.models import Variable
        run_optimization(bucket_name,input_path, uid_long_running, project_id, output_path)
        Variable.set("uid_long_running", int(uid_long_running)+1)

    bq_optimization_task = bq_optimization_callable(bucket_name,input_path, uid_long_running, project_id, output_path)
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

### GCS config json to get the config values
bq_ddl_validator_gcs_config_path = Variable.get("bq_ddl_validator_gcs_config_path",'gs://bq-ddl-validator/config.json')

with models.DAG('BQ-DDL-Validator', schedule_interval=datetime.timedelta(days=1), default_args=default_args) as dag:

    @task.virtualenv(task_id="bq-ddl-validator",
                     requirements=["cryptography==38.0.4","pymysql","cloud-sql-python-connector","google-cloud-secret-manager==2.16.1", "mysql-connector-python", "snowflake-connector-python", "google-cloud-storage"],
                     system_site_packages=True)
    
    def bq_optimization_callable(bq_ddl_validator_gcs_config_path):
        from bq_ddl_validator.main_dag import bq_ddl_validator
        bq_ddl_validator(bq_ddl_validator_gcs_config_path)


    bq_optimization_task = bq_optimization_callable(bq_ddl_validator_gcs_config_path)
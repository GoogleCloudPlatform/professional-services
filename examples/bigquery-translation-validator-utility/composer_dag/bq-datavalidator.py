# Copyright 2020 Google LLC
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
""" Module for Defining the Composer Dag """

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

project_id = Variable.get("project_id_sqlutility","google.com:sql-parity")
bucket_name = Variable.get("gcs_bucket_name",'bq-translation_validator')
test_file_path_TD = Variable.get("TD_file_path",'test-files/test_files_demo/TD_input/')
test_file_path_BQ = Variable.get("BQ_file_path",'test-files/test_files_demo/BQ_output/')
validation_output_path = Variable.get("Result_path",'Validation output/result.csv')
archive = Variable.get("Archive",True)
uid = int(Variable.get("uid",True))

with models.DAG('BQ-Translation-validator-final', schedule_interval=datetime.timedelta(days=1), default_args=default_args) as dag:

    @task.virtualenv(task_id="bq-translation-validation", 
                     requirements=["google-cloud-storage","sqlparser"],
                     system_site_packages=True)
    
    def bq_translation_validation_callable(bucket_name,test_file_path_BQ,test_file_path_TD,validation_output_path,archive,uid):
        from main_dag import run_validation
        from airflow.models import Variable
        run_validation(bucket_name,test_file_path_BQ,test_file_path_TD,validation_output_path,archive,uid)
        Variable.set("uid", int(uid)+1)
    bq_translation_validation_task = bq_translation_validation_callable(bucket_name,test_file_path_BQ,test_file_path_TD,validation_output_path,archive,uid)

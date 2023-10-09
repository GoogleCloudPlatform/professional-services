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

from airflow.providers.google.cloud.hooks.bigquery import  BigQueryHook

__author__ = 'nikunjbhartia@google.com (Nikunj Bhartia)'

BQ_PROJECT = "$BQ_PROJECT"
BQ_AUDIT_DATASET = "$BQ_AUDIT_DATASET"
BQ_AUDIT_TABLE = "$BQ_AUDIT_TABLE"
SCHEDULE_INTERVAL = "$SCHEDULE_INTERVAL"
CURRENT_DAG_ID = "$CURRENT_DAG_ID"
LAST_NDAYS = $LAST_NDAYS
SKIP_DAG_LIST = $SKIP_DAG_LIST

#Decrease this value if your get Error: The query is too large. The maximum standard SQL query length is 1024.00K characters, including comments and white space characters
INSERT_QUERY_BATCH_SIZE = $INSERT_QUERY_BATCH_SIZE

def metrics_collect_and_store_to_bq(**context):
    job_config = {
        "jobType": "QUERY",
        "query" : {
          "query": "SELECT 1;",
          "useLegacySql": False
        }
    }
    BigQueryHook().insert_job(configuration=job_config)
    return True

with DAG(
    dag_id=CURRENT_DAG_ID,
    start_date=airflow.utils.dates.days_ago(7),
    default_args={
        'depends_on_past': False,
        'retries': 0
    },
    max_active_runs=1,
    schedule_interval=SCHEDULE_INTERVAL,
    catchup=False,
) as dag:
  # Ref: https://airflow.apache.org/docs/apache-airflow/stable/_api/airflow/sensors/python/index.html
  # https://airflow.apache.org/docs/apache-airflow/2.2.3/_api/airflow/sensors/base/index.html
  states_collect_and_store = PythonOperator(
      task_id=f"collect_and_store2bq",
      python_callable=metrics_collect_and_store_to_bq,
      provide_context=True,
      dag=dag,
  )

  states_collect_and_store

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
import os

import airflow
import pendulum
from airflow.exceptions import AirflowSkipException
# from airflow.providers.google.cloud.operators.bigquery import BigQueryInsertJobOperator
from airflow.providers.google.cloud.hooks.bigquery import  BigQueryHook
from airflow.operators.python_operator import PythonOperator
from airflow.models import TaskInstance
from airflow.models import DagRun
from airflow import settings
from airflow import DAG
from airflow.utils.trigger_rule import TriggerRule
from builtins import len
import json
from datetime import datetime, timedelta
from sqlalchemy import (
  func, or_, and_
)

# # DDL
# create or replace table validation_results.airflow_states (
#     dag_id STRING,
# run_id STRING,
# run_state STRING,
# run_start_ts TIMESTAMP,
# run_end_ts TIMESTAMP,
# tasks ARRAY<STRUCT<id STRING, job_id STRING, operator STRING, state STRING, start_ts TIMESTAMP, end_ts TIMESTAMP>>,
# created_at TIMESTAMP
# );

__author__ = 'nikunjbhartia@google.com (Nikunj Bhartia)'

BQ_PROJECT = "$BQ_PROJECT"
BQ_AUDIT_DATASET = "$BQ_AUDIT_DATASET"
BQ_AUDIT_TABLE = "$BQ_AUDIT_TABLE"
SCHEDULE_INTERVAL = "$SCHEDULE_INTERVAL"
CURRENT_DAG_ID = "$CURRENT_DAG_ID"
LAST_NDAYS = $LAST_NDAYS
SKIP_DAG_LIST = $SKIP_DAG_LIST

# Dont increase this value
# Otherwise Error: The query is too large. The maximum standard SQL query length is 1024.00K characters, including comments and white space characters
INSERT_QUERY_BATCH_SIZE = 20

# Need to batch sqls because xcom query fails when a long text is stored with error:
# ERROR - (_mysql_exceptions.DataError) (1406, "Data too long for column 'value' at row 1")
# Airflow uses SQLAlchecmy BLOB on MySQL which limits the xcom.value to 65,535 bytes

# when tried using BQHook and running query: Still Getting Error
# ERROR - 400 POST https://bigquery.googleapis.com/bigquery/v2/projects/nikunjbhartia-test-clients/jobs?prettyPrint=false: The query is too large. The maximum legacy SQL query length is 256.000K characters, including comments and white space characters.
# So, batching still becomes important
# Somehow this error occurs only with airflow1 - and not with airflow2
def batch(iterable, n=1):
  l = len(iterable)
  for ndx in range(0, l, n):
    yield iterable[ndx:min(ndx + n, l)]

def mertics_collect_and_store_to_bq(**context):
  # https://airflow.apache.org/docs/apache-airflow/2.2.3/templates-ref.html
  print(context)
  prev_success_start_time = context.get(
      "prev_start_date_success") or (datetime.now() - timedelta(days=LAST_NDAYS))

  if context.get("ts"):
    curr_start_time =  pendulum.parse(context.get("ts"))
  else:
    curr_start_time = pendulum.now()

  start_time_filter = pendulum.instance(prev_success_start_time).subtract(minutes=1)
  end_time_filter = curr_start_time.subtract(minutes=1)

  session = settings.Session()
  query = session.query(
      DagRun.dag_id,
      DagRun.run_id,
      DagRun.state,
      func.min(DagRun.start_date),
      func.max(DagRun.end_date),
      func.json_arrayagg(
          func.json_object(
              "task_id",
              TaskInstance.task_id,
              "job_id",
              TaskInstance.job_id,
              "operator",
              TaskInstance.operator,
              "state",
              TaskInstance.state,
              "start_date",
              TaskInstance.start_date,
              "end_date",
              TaskInstance.end_date)).label("tasks")) \
    .filter(
      # DagRun.execution_date >= start_time_filter,
      # DagRun.execution_date < end_time_filter,
      and_(
          or_(and_(TaskInstance.start_date >= start_time_filter, TaskInstance.start_date < end_time_filter),
              and_(TaskInstance.end_date >= start_time_filter, TaskInstance.end_date < end_time_filter)),
          DagRun.dag_id == TaskInstance.dag_id,
          DagRun.dag_id.notin_(SKIP_DAG_LIST))) \
    .group_by(DagRun.dag_id, DagRun.run_id, DagRun.state)

  query_results = query.all()
  print(f"Query : \n{str(query)}")
  print(f"Query Results Count = {len(query_results)}")

  if len(query_results) == 0:
    print("Skipping the task because there is no query output")
    raise AirflowSkipException

  index = 0
  xcom_query_keylist = []
  for query_results_batch in batch(query_results, INSERT_QUERY_BATCH_SIZE):
    # xcom_query_key = f"bq_insert_key_{index}"
    # xcom_query_keylist.append(xcom_query_key)
    index = index + 1
    print(f"Executing Batch: {index}")
    print(f"query batch size: {len(query_results_batch)}")
    print(f"query batch result: {query_results_batch}")


    insert_sql_prefix = f"INSERT INTO `{BQ_PROJECT}.{BQ_AUDIT_DATASET}.{BQ_AUDIT_TABLE}` VALUES "
    insert_values = []
    for dag_id, run_id, run_state, run_start_date, run_end_date, tasks in query_results_batch:
      task_values = []
      for task in json.loads(str(tasks)):
        task_value = f'STRUCT("{task.get("task_id")}" as id, ' \
                     f'"{task.get("job_id")}" as job_id, ' \
                     f'"{task.get("operator")}" as operator, ' \
                     f'"{task.get("state")}" as state, ' \
                     f'SAFE_CAST("{task.get("start_date")}" AS TIMESTAMP) as start_ts, ' \
                     f'SAFE_CAST("{task.get("end_date")}" AS TIMESTAMP) as end_ts) '
        task_values.append(task_value)

      # End of inner for loop
      insert_values.append(f'("{dag_id}",'
                           f' "{run_id}",'
                           f' "{run_state}",'
                           f' SAFE_CAST("{run_start_date}" as TIMESTAMP),'
                           f' SAFE_CAST("{run_end_date}" as TIMESTAMP),'
                           f' [{",".join(task_values)}],'
                           f' SAFE_CAST("{pendulum.now()}" as TIMESTAMP))')

    # End of Outer for loop
    insert_sql = insert_sql_prefix + ",".join(insert_values)
    # insert_query_sqls.append(insert_sql)
    # context.get("ti").xcom_push(xcom_query_key, insert_sql)

    # context.get("ti").xcom_push("xcom_query_keylist", xcom_query_keylist)
    job_config = {
        "jobType": "QUERY",
        "query" : {
          "query": insert_sql,
          "useLegacySql": False
        }
    }
    print(f"Executing BQ Query : {insert_sql}")
    # BigQueryHook().run_query(insert_sql, use_legacy_sql=False)
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
  metrics_collect_and_store = PythonOperator(
      task_id=f"collect_and_store2bq",
      python_callable=mertics_collect_and_store_to_bq,
      provide_context=True,
      dag=dag,
  )

  metrics_collect_and_store

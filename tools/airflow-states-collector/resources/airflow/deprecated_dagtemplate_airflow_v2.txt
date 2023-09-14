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


# Reason for Deprecation
# This dag uses two task, one for metrics collection using airflow model classes and other using BQ Operator
# The former task used to create BQ Insert SQL statement and push to xcome pulled by the next task.
# During scale tests, it was found that the second job might fail if the historic / delta records are too many
# Hence merging both the collection and BQ execution is important from scale perspective.
# There is an option of using Python branching / dynamic task genertion based on input records for batching,
# but no using this approch because that makes debugging difficult, task logs might be lost etc
# Sample Error recieved in BQ Operator when number of records were greater than 1500:  google.api_core.exceptions.BadRequest: 400 Resources exceeded during query execution: Not enough resources for query planning - too many subqueries or query is too complex.
# One of the reasons for this failure is the SQL query length which maxes at 1024K characters


import airflow
import pendulum
from airflow.exceptions import AirflowSkipException
from airflow.providers.google.cloud.operators.bigquery import \
  BigQueryInsertJobOperator
from airflow.operators.python import PythonOperator
from airflow.models import TaskInstance
from airflow.models import DagRun
from airflow import settings
from airflow import DAG
from airflow.utils.trigger_rule import TriggerRule
from builtins import len

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
def collect_all_stats(**kwargs):
  # https://airflow.apache.org/docs/apache-airflow/2.2.3/templates-ref.html
  print(kwargs)
  prev_success_start_time = kwargs.get(
      "prev_data_interval_start_success") or pendulum.now().subtract(days=LAST_NDAYS)
  curr_start_time = kwargs.get("data_interval_start")

  start_time_filter = prev_success_start_time.subtract(minutes=1)
  end_time_filter = curr_start_time.subtract(minutes=1)

  session = settings.Session()
  query = session.query(
      DagRun.dag_id,
      DagRun.run_id,
      DagRun.state,
      func.min(DagRun.start_date),
      func.max(DagRun.end_date),
      func.array_agg(
          func.json_build_object(
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
          DagRun.run_id == TaskInstance.run_id,
          DagRun.dag_id.not_in(SKIP_DAG_LIST))) \
    .group_by(DagRun.dag_id, DagRun.run_id, DagRun.state)

  query_results = query.all()
  print(f"Query : \n{str(query)}")
  print(f"Query Results Count = {len(query_results)}")

  if len(query_results) == 0:
    print("Skipping the task because there is no query output")
    raise AirflowSkipException

  insert_sql_prefix = f"INSERT INTO `{BQ_PROJECT}.{BQ_AUDIT_DATASET}.{BQ_AUDIT_TABLE}` VALUES "

  insert_values = []
  for dag_id, run_id, run_state, run_start_date, run_end_date, tasks in query_results:
    task_values = []
    for task in tasks:
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

  kwargs.get("ti").xcom_push("bq_insert_key", insert_sql)

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
  collect_stats = PythonOperator(
      task_id=f"collect_stats",
      python_callable=collect_all_stats,
      dag=dag,
  )

  insert_query_job = BigQueryInsertJobOperator(
      task_id="insert_query_job",
      trigger_rule=TriggerRule.ALL_SUCCESS,
      configuration={
          "query": {
              "query": "{{ ti.xcom_pull(task_ids='collect_stats', key='bq_insert_key') }}",
              "useLegacySql": False
          }
      }
  )

  collect_stats >> insert_query_job

# Copyright 2023 Google LLC
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

"""
A DAG factory to create workflows that you can deploy into Airflow
to periodically export metadata to a specified BigQuery location.

Note: DAG start_times are staggered to reduce composer environment load.
By default it will execute all table export between 00:00 and 00:30 UTC.

## Usage

1. Update the global variables. BQ_PROJECT, BQ_DATASET, GCS_BUCKET,
   GCS_OBJECT_PATH

2. WRITE_DISPOSITON is set to WRITE_TRUNCATE the BigQuery location by default.
   This means that any data removed from Airflow metadata DB via UI or cleanup
   processes will also be removed from BigQuery location. If you change to
   WRITE_APPEND you'll need to manage duplicate data in another process.
   
3. Modify the SOURCE_TABLES list to fit your airflow version and your
   desired tables to export. Currently set to tables for Airflow 2.4.3

4. Put the DAG in your Google Cloud Storage bucket.
"""

from datetime import datetime, timedelta

from airflow import models
from airflow.providers.google.cloud.transfers.postgres_to_gcs import (
    PostgresToGCSOperator,
)
from airflow.providers.google.cloud.transfers.gcs_to_bigquery import (
    GCSToBigQueryOperator,
)
from airflow.providers.google.cloud.operators.gcs import GCSDeleteObjectsOperator
from airflow.providers.google.cloud.sensors.gcs import (
    GCSObjectsWithPrefixExistenceSensor,
)
from airflow.providers.google.cloud.sensors.bigquery import BigQueryTableExistenceSensor

BQ_PROJECT = "<YOUR PROJECT CONTAINING BIGQUERY DATASET>"
BQ_DATASET = "<YOUR BIGQUERY DATASET>"
GCS_BUCKET = "<YOUR GOOGLE CLOUD STORAGE BUCKET>"
GCS_OBJECT_PATH = "<DESIRED GOOGLE CLOUD STORAGE PATH TO LOAD DATA INTO>"

WRITE_DISPOSITION = "WRITE_TRUNCATE"

POSTGRES_CONNECTION_ID = "airflow_db"
FILE_FORMAT = "csv"

SOURCE_TABLES = [
    "ab_permission",
    "ab_permission_view",
    "ab_permission_view_role",
    "ab_register_user",
    "ab_role",
    "ab_user",
    "ab_user_role",
    "ab_view_menu",
    "alembic_version",
    "callback_request",
    "connection",
    "dag",
    "dag_code",
    "dag_pickle",
    "dag_run",
    "dag_tag",
    "import_error",
    "job",
    "log",
    "log_template",
    "rendered_task_instance_fields",
    "sensor_instance",
    "serialized_dag",
    "session",
    "sla_miss",
    "slot_pool",
    "task_fail",
    "task_instance",
    "task_map",
    "task_reschedule",
    "trigger",
    "variable",
    "xcom",
]

default_args = {
    "owner": "auditing",
    "depends_on_past": False,
    "email": [""],
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=2),
}

START_MINUTE = 1

for table in SOURCE_TABLES:

    # stagger start times for dags to reduce load spike
    if START_MINUTE > 30:
        START_MINUTE = 0

    with models.DAG(
        f"export_{table}_v1_0",
        tags=["airflow_db"],
        description=f"Export all contents of {table} to BigQuery location.",
        is_paused_upon_creation=True,
        catchup=False,
        start_date=datetime(2023, 2, 5),
        dagrun_timeout=timedelta(minutes=30),
        max_active_runs=1,
        default_args=default_args,
        schedule_interval=f"{str(START_MINUTE)} 0 * * *",  # every day at 00:0<start_minute>
    ) as dag:

        START_MINUTE += 2

        query = f"SELECT * FROM {table};"

        # only pull last 7 days of session data (large table)
        # add more composer worker memory/storage if you'd like more data
        if table == "session":
            query = f"SELECT * FROM {table} where expiry > NOW() - INTERVAL '7 days';"

        postgres_to_gcs = PostgresToGCSOperator(
            task_id="postgres_to_gcs",
            postgres_conn_id=POSTGRES_CONNECTION_ID,
            sql=query,
            bucket=GCS_BUCKET,
            filename=f"{GCS_OBJECT_PATH}/{table}/{table}.{FILE_FORMAT}",
            export_format=FILE_FORMAT,
            field_delimiter=",",
            gzip=False,
            use_server_side_cursor=False,
            execution_timeout=timedelta(minutes=15),
        )

        # will fail if table row count == 0 (no file will exist)
        output_check = GCSObjectsWithPrefixExistenceSensor(
            task_id="output_check",
            bucket=GCS_BUCKET,
            prefix=f"{GCS_OBJECT_PATH}/{table}/",
            mode="reschedule",
            poke_interval=60,
            timeout=60 * 3,
        )

        gcs_to_bq = GCSToBigQueryOperator(
            task_id="gcs_to_bq",
            bucket=GCS_BUCKET,
            source_objects=[f"{GCS_OBJECT_PATH}/{table}/{table}.{FILE_FORMAT}"],
            destination_project_dataset_table=".".join([BQ_PROJECT, BQ_DATASET, table]),
            create_disposition="CREATE_IF_NEEDED",
            write_disposition=WRITE_DISPOSITION,
            skip_leading_rows=1,
            allow_quoted_newlines=True,
            field_delimiter=",",
            execution_timeout=timedelta(minutes=10),
        )

        table_check = BigQueryTableExistenceSensor(
            task_id="table_check",
            project_id=BQ_PROJECT,
            dataset_id=BQ_DATASET,
            table_id=table,
            mode="reschedule",
            poke_interval=60,
            timeout=60 * 3,
        )

        cleanup = GCSDeleteObjectsOperator(
            task_id="cleanup",
            bucket_name=GCS_BUCKET,
            prefix=f"{GCS_OBJECT_PATH}/{table}/",
            execution_timeout=timedelta(minutes=5),
        )

        postgres_to_gcs >> output_check >> gcs_to_bq >> table_check >> cleanup

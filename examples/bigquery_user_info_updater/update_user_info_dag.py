# Copyright 2018 Google LLC
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


import datetime

from airflow import models
from airflow.contrib.operators import bigquery_operator
from airflow.contrib.operators import bigquery_get_data
from airflow.operators.python_operator import PythonOperator

from updater_tools import query_creator

start_date = datetime.datetime(2019, 8, 16, 2)
timestamp = '2019-06-10 14:12:47 UTC'

project_id= models.Variable.get('project_id')
schema_path= models.Variables.get('schema_path')
dataset_id = models.Variables.get('dataset_id')
final_table_id = models.Variables.get('final_table_id')
updates_table_id = models.Variables.get('updates_table_id')
temp_updates_table_id = models.Variables.get('temp_updates_table_id')
user_id_field_name = models.Variables.get('user_id_field_name')
ingest_timestamp_field_name = models.Variables.get('ingest_timestamp_field_name')

max_ingest_timestamp = models.Variable.get('max_ingest_timestamp')

# Create queries needed to run the updates
update_query_creator = query_creator.QueryCreator(
    schema_path,
    user_id_field_name,
    ingest_timestamp_field_name,
    project_id,
    dataset_id,
    updates_table_id,
    temp_updates_table_id,
    final_table_id
)
gather_updates_query = update_query_creator.create_gather_updates_query()
merge_updates_query = update_query_creator.create_merge_query()

# [START composer_notify_failure]
default_dag_args = {
    'start_date': start_date,
    'retries': 1,
    'retry_delay': datetime.timedelta(seconds=10),
    'project_id': project_id
}

with models.DAG(
        'bigquery_user_updater',
        schedule_interval=datetime.timedelta(minutes=5),
        default_args=default_dag_args) as dag:

    gather_updates = bigquery_operator.BigQueryOperator(
        task_id='gather_updates',
        bql=gather_updates_query.format(
            max_ingest_timestamp
        ),
        destination_dataset_table=dataset_id + '.' + temp_updates_table_id,
        write_disposition='WRITE_TRUNCATE',
        use_legacy_sql=False,
    )

    merge_updates = bigquery_operator.BigQueryOperator(
        task_id='merge_updates',
        bql=merge_updates_query,
        use_legacy_sql=False,
    )

    query_max_timestamp = bigquery_operator.BigQueryOperator(
        task_id='query_max_timestamp_updates',
        bql="""
                SELECT max(timestamp) as latest_merge FROM `{0:s}.{1:s}.{2:s}`
            """.format(
            project_id,
            bq_dataset_name,
            temp_updates_table
        ),
        destination_dataset_table=bq_dataset_name + '.' + max_timestamp_temp_table,
        use_legacy_sql=False,
        write_disposition='WRITE_TRUNCATE',
    )

    get_max_timestamp = bigquery_get_data.BigQueryGetDataOperator(
        task_id='get_max_ingest_timestamp',
        dataset_id=dataset_id,
        table_id=max_timestamp_temp_table,
        max_results='1',
        selected_fields='latest_merge'
    )

    def process_data_from_bq(**kwargs):
        ti = kwargs['ti']
        bq_data = ti.xcom_pull(task_ids='get_max_timestamp')
        # reset latest merge time
        max_ts = str(bq_data[0][0])
        if max_ts != 'None':
            models.Variable.set('latest_merge', str(max_ts))


    process_data = PythonOperator(
        task_id='process_data_from_bq',
        python_callable=process_data_from_bq,
        provide_context=True
    )

    # Define DAG dependencies.
    (
        gather_updates
        >> merge_updates
        >> query_max_timestamp
        >> get_max_timestamp
        >> process_data
    )


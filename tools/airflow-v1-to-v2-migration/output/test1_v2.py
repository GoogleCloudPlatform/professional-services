from airflow import DAG
#Migration Utility Generated Comment -- Change Type = Changes in import , Impact = Import Statement Changed
from airflow.providers.google.cloud.operators.bigquery import BigQueryCreateEmptyTableOperator
from datetime import datetime

default_args = {
    'start_date': datetime(2023, 5, 20),
}

with DAG('my_dag', default_args=default_args, schedule_interval=None) as dag:
    create_table = BigQueryCreateEmptyTableOperator(
        task_id='create_table',
        project_id='your_project_id',
        dataset_id='your_dataset_id',
        table_id='your_table_id',
        schema_fields=[
            {'name': 'column1', 'type': 'STRING', 'mode': 'NULLABLE'},
            {'name': 'column2', 'type': 'INTEGER', 'mode': 'NULLABLE'},
        ],
        gcp_conn_id='google_cloud_default'
    )

    create_table

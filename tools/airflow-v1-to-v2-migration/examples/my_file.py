from datetime import datetime
from airflow import DAG
from airflow.operators.dummy_operator import DummyOperator
from airflow.operators.python_operator import PythonOperator
from airflow.contrib.operators.gcs_to_bq import GoogleCloudStorageToBigQueryOperator
from airflow.contrib.operators.dataproc import DataprocClusterCreateOperator


def print_hello(message):
    return message


dag = DAG('TestMigrationDag', description='Sample DAG to test Migration Tool',
          schedule_interval='0 12 * * *',
          start_date=datetime(2017, 3, 20), catchup=False)

start_operator = PythonOperator(task_id='start_operator', python_callable=print_hello('start'), dag=dag)

task_1 = GoogleCloudStorageToBigQueryOperator(
    task_id='gcs_to_bq_example',
    bucket='cloud-samples-data',
    source_objects=['bigquery/us-states/us-states.csv'],
    destination_project_dataset_table='airflow_test.gcs_to_bq_table',
    schema_fields=[
        {'name': 'name', 'type': 'STRING', 'mode': 'NULLABLE'},
        {'name': 'post_abbr', 'type': 'STRING', 'mode': 'NULLABLE'},
    ],
    write_disposition='WRITE_TRUNCATE',
    dag=dag)

CLUSTER_CONFIG = { // sample
cluster
config
goes
here}

task_2 = create_cluster = DataprocCreateClusterOperator(
    task_id="create_cluster",
    project_id=PROJECT_ID,
    cluster_config=CLUSTER_CONFIG,
    cluster_name='test-cluster',
    xyz
)

end_operator = PythonOperator(task_id='end_operator', python_callable=print_hello, dag=dag)

start_operator >> task_1 >> task_2 >> end_operator

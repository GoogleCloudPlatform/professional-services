import datetime

import airflow
from google.cloud import storage
from airflow.operators.python import PythonOperator
from airflow.providers.google.cloud.operators.bigquery import BigQueryInsertJobOperator
from airflow.contrib.operators.bigquery_operator import BigQueryOperator

def load_data_into_final_table(**context):

    query = context['dag_run'].conf['sql'].strip()

    run_query_job = BigQueryOperator(
        task_id="load_data_into_final_table",
        sql=query,
        use_legacy_sql=False,
        write_disposition='WRITE_TRUNCATE'
    )

    run_query_job.execute(context)

def load_file_into_column(**context):
    gcs_client = storage.Client()
    bucket = gcs_client.bucket(context['dag_run'].conf['bucket'])
    file_name = context['dag_run'].conf['file']
    blob = bucket.blob(file_name)
    file_data = ""
    with blob.open('rb') as f:
        file_data = f.read()

    dataset_name = context['dag_run'].conf['dataset_name']
    intermediate_table_name = context['dag_run'].conf['intermediate_table_name']
    dataset_location = context['dag_run'].conf['dataset_location']
    
    INSERT_ROW_QUERY = (
        f"INSERT `" + dataset_name + "." + intermediate_table_name + "` VALUES (\'" + str(file_name)+ "\', " + str(file_data) + ");"
    )

    insert_query_job = BigQueryInsertJobOperator(
        task_id="insert_query_job",
        configuration={
            "query": {
                "query": INSERT_ROW_QUERY,
                "useLegacySql": False,
            }
        },
        location=dataset_location,
    )
    insert_query_job.execute(context)
    

with airflow.DAG(  
        'load_file_into_bigquery',
        start_date=datetime.datetime(2021, 1, 1),
        # Not scheduled, trigger only
        schedule_interval=None) as dag:
         load_file = PythonOperator(
            task_id='load_file_into_column',
            python_callable=load_file_into_column,
            provide_context=True,
            dag=dag,
         )
         invoke_udf = PythonOperator(
            task_id='load_data_into_final_table',
            python_callable=load_data_into_final_table,
            provide_context=True,
            dag=dag,
         )

         load_file >> invoke_udf

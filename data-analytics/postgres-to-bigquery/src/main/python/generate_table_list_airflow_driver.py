#!/usr/bin/python3

import os
import configparser
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.operators.dummy_operator import DummyOperator
from airflow.models import Variable
from airflow.hooks import postgres_hook
from datetime import datetime, timedelta
from generate_table_list import write_table_list

try:
    airflow_home = Variable.get("AIRFLOW_HOME")
except KeyError as e:
    airflow_home = "/home/airflow_user/airflow/"
    Variable.set("AIRFLOW_HOME", airflow_home)

config = configparser.RawConfigParser()
config.read(airflow_home + "/dags/cloudsql_to_bigquery.cfg")
postgres_config_section_name = 'Postgres'
demo_config_section_name = 'DEMO'

# DEMO Config
demo_project_id = config.get(demo_config_section_name, 'project_id')
demo_schema_name = config.get(demo_config_section_name, 'schema_name')
demo_gcs_schema_folder = config.get(demo_config_section_name, 'gcs_schema_uri')
demo_gcs_data_folder = config.get(demo_config_section_name, 'gcs_data_uri')
demo_local_schema_dir = config.get(demo_config_section_name, 'staging_schema_local_dir')
demo_local_data_dir = config.get(demo_config_section_name, 'staging_data_local_dir')
demo_output_table_file_local = config.get(demo_config_section_name, 'staging_table_list_local_dir')
demo_output_table_file_gcs = config.get(demo_config_section_name, 'gcs_table_list_uri')

# Database Config
db_connection_id = config.get(postgres_config_section_name, 'airflow_connection_id')
db_connection = postgres_hook.PostgresHook(db_connection_id)
job_pool = config.get('AIRFLOW', 'job_pool')

default_args = {
    'owner': 'airflow_user',
    'depends_on_past': False,
    'email': ['demouser@gmail.com'],
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 10,
    'retry_delay': timedelta(minutes=5),
    'start_date': datetime(2017, 10, 1),
}
dag = DAG('Demo_Generate_Table_List_To_GCS',
          default_args=default_args,
          schedule_interval='45 */1 * * *',
          catchup=False)

wait_for_finish = DummyOperator(task_id='wait_for_finish', trigger_rule='all_success', dag=dag)

# Download data and schema of each table and load into BigQuery
t_labs_generate_task = PythonOperator(task_id="generate_list_labs",
                                python_callable=write_table_list,
                                op_args=[db_connection, demo_schema_name, demo_gcs_schema_folder,
                                         demo_gcs_data_folder, demo_output_table_file_gcs, demo_project_id],
                                pool= job_pool, dag=dag)
t_labs_generate_task >> wait_for_finish

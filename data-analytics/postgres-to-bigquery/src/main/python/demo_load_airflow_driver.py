#!/usr/bin/python3
import csv
import pathlib
import logging

from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.operators.dummy_operator import DummyOperator
from airflow.operators.bash_operator import BashOperator
from airflow.models import Variable
from airflow.hooks import postgres_hook
from datetime import datetime, timedelta
from dw_load_config.py import *
from postgres_to_bigquery_utils import *

try:
    airflow_home = Variable.get("AIRFLOW_HOME")
except KeyError as e:
    airflow_home = "/home/airflow_user/airflow/"
    Variable.set("AIRFLOW_HOME", airflow_home)

config = Config(airflow_home + "/dags/cloudsql_to_bigquery.cfg", LoadJobType.DEMO)
# Database Config
db_connection = postgres_hook.PostgresHook(config.db_connection_id)
job_pool = config.job_pool
# Schema and data file directories
schema_name = config.schema_name
gcs_schema_folder = config.gcs_schema_folder
gcs_data_folder = config.gcs_data_folder
local_schema_dir = config.local_schema_dir
local_data_dir = config.local_data_dir
table_file_local = config.table_file_local
table_file_gcs = config.table_file_gcs
projectID = config.projectID
src_bigquery_dataset_name = config.src_bigquery_dataset_name
dest_bigquery_dataset_name = config.dest_bigquery_dataset_name

#Bill timestamp
timestamp_variable_name = "demo_timestamp"
timestamp_lock_name = "demo_timestamp_lock"
timestamp_lastrun_variable_name = "demmo_timestamp_lastrun"
lastrun_timestamp = str()
# Use Airflow Variable to store timestamp for the entire job
#  to avoid losing task ID when Airflow reload DAG
trailing_timestamp = "_{:%Y_%m_%d_%H_%M}".format(datetime.now())
try:
    timestamp_lock = Variable.get(timestamp_lock_name)
    if timestamp_lock == 'True':
        trailing_timestamp = Variable.get(timestamp_variable_name)
    else:
        Variable.set(timestamp_variable_name, trailing_timestamp)
except KeyError as e:
    Variable.set(timestamp_variable_name, trailing_timestamp)
    Variable.set(timestamp_lock_name, "False")

try:
    lastrun_timestamp = Variable.get(timestamp_lastrun_variable_name)
except KeyError as e:
    None

#Create local directories if not exist
schema_path = pathlib.Path(local_schema_dir)
data_path = pathlib.Path(local_data_dir)
if not schema_path.exists():
    schema_path.mkdir()
if not data_path.exists():
    data_path.mkdir()

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

dag = DAG('Demo_Load_to_BQ',
          default_args=default_args,
          schedule_interval='0 */6 * * *',
          catchup=False)

if len(dag.get_active_runs()) < 1:
    #Download table list
    download_table_list(table_file_gcs, table_file_local)
    logging.info("Downloaded new table list.")

#Open table file
with open(table_file_local, 'r') as file:
    reader = csv.reader(file)
    table_list = list(reader)
    del table_list[0]  # Skip header
file.close()

wait_for_lock = DummyOperator(task_id='bill_wait_after_lock', trigger_rule='all_success', dag=dag)
wait_for_loading = DummyOperator(task_id='bill_wait_after_loading', trigger_rule='all_success', dag=dag)
wait_for_update = DummyOperator(task_id='bill_wait_after_updating', trigger_rule='all_success', dag=dag)
set_timestamp_task = BashOperator(task_id='bill_set_timestamp', trigger_rule='all_success',
                                  bash_command="airflow variables --set " + timestamp_lock_name + " 'True'",
                                  dag=dag)
set_timestamp_task.set_downstream(wait_for_lock)

# Download data and schema of each table and load into BigQuery
for table in table_list:
    table_name = table[0]
    task_id_download = 'download_table_schema_and_data_' + table_name
    t_download_task = PythonOperator(task_id=task_id_download,
                                     python_callable=download_schema_and_data,
                                     op_args=[db_connection, schema_name, table_name, gcs_schema_folder,
                                              gcs_data_folder, local_schema_dir, local_data_dir],
                                     pool= job_pool, dag=dag)

    # required arg list
    load_to_bigquery_args = [
        projectID, src_bigquery_dataset_name + trailing_timestamp, table_name, table[1], table[2]]
    task_id_load = 'load_bq_table_' + table_name
    t_load_bigquery_task = PythonOperator(
        task_id=task_id_load, python_callable=load_to_bigquery,
        op_args=load_to_bigquery_args, dag=dag)

    t_download_task.set_upstream(wait_for_lock)
    t_download_task.set_downstream(t_load_bigquery_task)
    t_load_bigquery_task.set_downstream(wait_for_loading)

# Bulk Update View Query
for table in table_list:
    table_name = table[0]
    # required arg list
    update_view_task_args = [
        projectID, src_bigquery_dataset_name + trailing_timestamp, dest_bigquery_dataset_name, table_name, table_name]
    task_id = 'dpdate_view_' + table_name
    t = PythonOperator(
        task_id=task_id, python_callable=update_view_table,
        op_args=update_view_task_args, dag=dag
    )
    t.set_upstream(wait_for_loading)
    t.set_downstream(wait_for_update)

clean_gcs_task = PythonOperator(task_id='clean_gcs',
                                python_callable=clean_gcs_bucket,
                                trigger_rule='all_success',
                                op_args=[gcs_schema_folder,gcs_data_folder], dag=dag)
reset_timestamp_lock_task = BashOperator(task_id='reset_timestamp_lock',
                                         trigger_rule='all_success',
                                         bash_command="airflow variables --set " + timestamp_lock_name + " 'False'",
                                         dag=dag)
delete_lastrun_dataset_task = PythonOperator(task_id='delete_lastrun_dataset',
                                             python_callable=delete_lastrun_dataset,
                                             op_args=[src_bigquery_dataset_name + lastrun_timestamp, projectID],
                                             trigger_rule='all_success', dag=dag)
update_lastrun_timestamp_task = BashOperator(task_id='update_lastrun_timestamp',
                                             trigger_rule='all_success',
                                             bash_command="airflow variables --set " + timestamp_lastrun_variable_name
                                                      + " '{}'".format(trailing_timestamp),
                                             dag=dag)
delete_lastrun_dataset_task.set_upstream(wait_for_update)
delete_lastrun_dataset_task.set_downstream(update_lastrun_timestamp_task)
update_lastrun_timestamp_task.set_downstream(reset_timestamp_lock_task)
reset_timestamp_lock_task.set_downstream(clean_gcs_task)

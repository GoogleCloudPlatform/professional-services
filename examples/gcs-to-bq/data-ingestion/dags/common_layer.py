# Copyright 2023 Google LLC. This software is provided as-is, without warranty
# or representation for any use or purpose. Your use of it is subject to your
# agreement with Google.

from includes.loggers import log_info
from includes.utils import get_local_dag_config_files, parse_dag_configuration, removesuffix

from airflow import DAG
import airflow.models

from airflow.models import Variable
from airflow.operators.dummy_operator import DummyOperator
from airflow.providers.google.cloud.sensors.gcs import GCSObjectsWithPrefixExistenceSensor
from airflow.providers.google.cloud.operators.bigquery import BigQueryInsertJobOperator
from airflow.operators.trigger_dagrun import TriggerDagRunOperator

from airflow.operators.python import get_current_context
from airflow.utils.trigger_rule import TriggerRule
from airflow.decorators import task
from datetime import datetime, timedelta
import os

################################ Main Workflow steps below ##################################
GOOGLE_CLOUD_LANDING_BUCKET_CONN_ID = Variable.get("common_layer_landing_bucket_conn_id", default_var="google_cloud_default")
GOOGLE_CLOUD_PROCESSING_BUCKET_CONN_ID = Variable.get("common_layer_processing_bucket_conn_id", default_var="google_cloud_default")


def create_data_ingestion_dag(dag_id,
                                schedule,
                                default_args,
                                source_config,
                                processing_config,
                                destination_config
                                ):
    """Return new created DAG from given config
    Input :
    - dag_id string
    - schedule String
    - default_args dict
    - source_config dict
    Output : DAG
    """

    source_objects_prefix = source_config.source_objects_prefix
    source_format = source_config.source_format
    landing_bucket = source_config.landing_bucket
    store_bucket = destination_config.store_bucket
    target_project_id = destination_config.target_project_id
    location = destination_config.location
    dataset_id = destination_config.dataset_id
    table_name = destination_config.table_name

    def insert_audit_log(context, task_id=None, event_type=None, message=None):
        def prepare_audit_log_input(dag_id, table_name, execution_date, task_id, event_type, message):
            # message = message.replace("'", '') if message else None     # remove single quotes from the exception 
            sql = [
                f"BEGIN "
                f"CREATE TABLE IF NOT EXISTS {target_project_id}.{dataset_id}.audit_logs (dag_id STRING, execution_date TIMESTAMP, table_name STRING, task_id STRING, event_type STRING, message STRING, ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"
                f"INSERT INTO {target_project_id}.{dataset_id}.audit_logs(dag_id, execution_date, table_name, task_id, event_type, message) values('{dag_id}', '{execution_date}', '{table_name}', '{task_id}', '{event_type}', '{message}'); " 
                f"END ;"
            ]
            return sql

        sql = prepare_audit_log_input(
            dag_id=dag_id,
            table_name=table_name,
            execution_date=context.get('logical_date', None),
            task_id=task_id,
            event_type=event_type,
            message=message
        )
        
        BigQueryInsertJobOperator(
            task_id="audit_log", 
            gcp_conn_id=GOOGLE_CLOUD_PROCESSING_BUCKET_CONN_ID,
            location=location,
            configuration={
                "query": {
                    "query": sql,
                    "useLegacySql": False
                }
            },
        ).execute(context)
    
    def dag_start_callback(context): 
        insert_audit_log(context=context, task_id=None, event_type='START', message=None)

    def task_failure_callback(context): 
        insert_audit_log(context=context, task_id=context['task'].task_id, event_type='ERROR', message=context['exception'])

    def dag_success_callback(context):
        try:
            insert_audit_log(context=context, task_id=None, event_type='SUCCESS', message=None)
        finally:
            # schedule a new run if it is not a backfill (dag_id has a prefix added automatically)
            if "backfill_" not in context['run_id']:
                TriggerDagRunOperator(
                    task_id="trigger_next_dag_run",
                    trigger_dag_id=dag_id,
                ).execute(context)

    def dag_failure_callback(context):
        insert_audit_log(context=context, task_id=None, event_type='ERROR', message="DAG has failed")

    # override the start date with the right format
    if "start_date" in default_args:
        default_args["start_date"] = datetime.strptime(default_args.get("start_date"), '%d/%m/%y')
    
    # override the end date with the right format
    if "end_date" in default_args:
        default_args["end_date"] = datetime.strptime(default_args.get("end_date"), '%d/%m/%y')
    
    # set the failure callback for each task
    default_args['on_failure_callback'] = task_failure_callback
    
    # define the cutoff date (important for the time schedule - the previous day dag should fail and the new should start)
    if schedule == "@daily":
        interval_days = 1   
    elif schedule == "@weekly":
        interval_days = 7
    elif schedule == "@monthly":
        interval_days = 30
    else:
        interval_days = 365

    dag_cutoff_datetime = datetime.now().replace(minute=0, second=0, microsecond=0) + timedelta(days=interval_days)
    seconds_till_dag_cutoff = (dag_cutoff_datetime - datetime.now()).seconds
           
    dag = DAG(dag_id,
                schedule_interval=schedule,
                default_args=default_args,
                max_active_runs=1,
                dagrun_timeout=timedelta(seconds=seconds_till_dag_cutoff),
                catchup=False,
                on_success_callback=dag_success_callback,
                on_failure_callback=dag_failure_callback)

    with dag:
        
        start = DummyOperator(
            task_id='start',
            depends_on_past=True,
            wait_for_downstream=True,
            dag=dag,
            on_failure_callback=None
        )
        
        wait_for_data = GCSObjectsWithPrefixExistenceSensor(
            task_id="gcs_wait_for_data_files",
            google_cloud_conn_id=GOOGLE_CLOUD_LANDING_BUCKET_CONN_ID,
            bucket=landing_bucket,
            prefix=source_objects_prefix,
            mode="reschedule",
            # TODO: fix and put to the configuration file
            poke_interval=300,
        )

        @task(task_id="native_table", on_success_callback=dag_start_callback, trigger_rule=TriggerRule.NONE_FAILED)
        def load_native_storage(ti: airflow.models.TaskInstance = None):
            """This function will conditionally load data to BigQuery"""
            source_format_arg = source_format.upper()
            source_format_arg = "NEWLINE_DELIMITED_JSON" if source_format_arg == 'JSON' else source_format_arg
            
            args = {
                "task_id": "load_to_native_storage_inner",
                # TODO: validate if this is a correct connection
                "gcp_conn_id": GOOGLE_CLOUD_PROCESSING_BUCKET_CONN_ID,
                "project_id": target_project_id,
                "configuration": {
                    "load": {
                        "source_uris": f"gs://{landing_bucket}/*",
                        "destination_table": {
                            "project_id": target_project_id,
                            "dataset_id": dataset_id,
                            "table_id": f"{table_name}",
                        },
                        "write_disposition": destination_config.native_write_disposition,
                        "create_disposition": destination_config.native_create_disposition,
                        "source_format": source_format_arg,
                        "allow_jagged_rows": True,
                        "ignore_unknown_values": True,
                    }
                },
                "location": location,
                "deferrable": False,
            }
            args["configuration"]["load"]["autodetect"] = True
            # provide filed delimiter (for CSV only)
            if source_format_arg == "CSV":
                args["configuration"]["load"]["field_delimiter"] = destination_config.native_csv_field_delimiter
            
            # provide skip leading rows if the config value is >=0 (CSV only)
            if source_format_arg == "CSV" and destination_config.native_csv_skip_leading_rows:
                args["configuration"]["load"]["skip_leading_rows"] = destination_config.native_csv_skip_leading_rows
                
            # provide max bad records (CSV and JSON only)
            if source_format_arg == "CSV" or source_format_arg == "NEWLINE_DELIMITED_JSON":
                args["configuration"]["load"]["max_bad_records"] = destination_config.native_csv_json_max_bad_records
                
            # add schema update options (only if the strategy is WRITE_APPEND)
            if destination_config.native_write_disposition == "WRITE_APPEND":
                args["configuration"]["load"]["schema_update_options"] = ["ALLOW_FIELD_ADDITION", "ALLOW_FIELD_RELAXATION"]

            # add custom encoding from the configuration
            if destination_config.native_encoding:
                args["configuration"]["load"]["encoding"] = destination_config.native_encoding
            
            BigQueryInsertJobOperator(**args).execute(get_current_context())

        load_to_native_storage_op = load_native_storage()

        @task(task_id="move_to_store", trigger_rule=TriggerRule.NONE_FAILED)
        def move_to_store(ti: airflow.models.TaskInstance = None):
            """Moving processing files to store bucket"""
            from airflow.providers.google.cloud.transfers.gcs_to_gcs import GCSToGCSOperator
            
            landing_file_paths = ti.xcom_pull(task_ids='gcs_wait_for_data_files', key='return_value')
            for file_path in landing_file_paths:
                destination_path = f"{file_path}"
                # GCSToGCS doesn't support moving multiple files by path in version 8.5.0
                # (included in composer 2.1.3 airflow 2.3.4)
                # it will only move multiple files if you point to directory

                GCSToGCSOperator(
                    task_id='move_original_to_store',
                    source_bucket=landing_bucket,
                    source_object=file_path,
                    destination_bucket=store_bucket,
                    destination_object=destination_path,
                    move_object=True,
                    gcp_conn_id=GOOGLE_CLOUD_PROCESSING_BUCKET_CONN_ID,
                ).execute(get_current_context())

        move_to_store_op = move_to_store()

        end = DummyOperator(
            task_id='end',
            dag=dag,
        )

        # define the dag dependencies
        start >> wait_for_data >> load_to_native_storage_op >> move_to_store_op >> end
        
    log_info(msg=f'DAG {dag_id} is added')

    return dag

################################ Main Function ##################################

def main(config_path):
    """Parse the configuration and submit dynamic dags to airflow global namespace based on config files from GCS bucket.
    args:
    config_path - path of the config (bucket / local path) where the configuration file are
    """
    dag_config_files = get_local_dag_config_files(config_path)
        
    log_info(msg=f"added config: {dag_config_files}")
    
    ingestion_dags = parse_dag_configuration(dag_config_files)
    for dag in ingestion_dags:
        globals()[dag.dag_id] = create_data_ingestion_dag(dag.dag_id,
                                        dag.schedule,
                                        dag.default_args,
                                        dag.source_config,
                                        dag.processing_config,
                                        dag.destination_config
        )

# set up the relative path (to avoid using Airflow vars)
config_path=f"{removesuffix(os.getenv('DAGS_FOLDER', '/Users/dags'), 'dags')}data/common_layer/config/"

main(config_path)

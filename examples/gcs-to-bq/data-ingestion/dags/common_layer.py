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

from airflow.operators.python import get_current_context
from airflow.utils.trigger_rule import TriggerRule
from airflow.decorators import task
from datetime import datetime
import json
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
    target_project_id = destination_config.target_project_id
    location = destination_config.location
    dataset_id = destination_config.dataset_id
    table_name = destination_config.table_name

    # override the start date with the right format
    if "start_date" in default_args:
        default_args["start_date"] = datetime.strptime(default_args.get("start_date"), '%d/%m/%y')
           
    dag = DAG(dag_id,
                schedule_interval=schedule,
                default_args=default_args,
                max_active_runs=1,
                catchup=False)

    with dag:
        
        start = DummyOperator(
            task_id='start',
            depends_on_past=True,
            wait_for_downstream=True,
            dag=dag,
        )
        
        wait_for_data = GCSObjectsWithPrefixExistenceSensor(
            task_id="gcs_wait_for_data_files",
            google_cloud_conn_id=GOOGLE_CLOUD_LANDING_BUCKET_CONN_ID,
            bucket=landing_bucket,
            prefix=source_objects_prefix,
            mode="reschedule",
            # TODO: fix and put to the configuration file
            poke_interval=300
        )

        @task(task_id="native_table", trigger_rule=TriggerRule.NONE_FAILED)
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

        end = DummyOperator(
            task_id='end',
            dag=dag,
        )

        # define the dag dependencies
        start >> wait_for_data >> load_to_native_storage_op >> end
        
    log_info(msg=f'DAG {dag_id} is added')

    return dag

################################ Main Function ##################################

def main(config_path):
    """Parse the configuration and submit dynamic dags to airflow global namespace based on config files from GCS bucket.
    args:
    config_path - path of the config (bucket / local path) where the configuration file are
    """
    print(config_path)
    # try:
    #     dag_config_files = get_gcs_dag_config_files(config_path)
    # except:
    dag_config_files = get_local_dag_config_files(config_path)
        
    log_info(msg=f"added config: {dag_config_files}")
    
    ingestion_dags = parse_dag_configuration(dag_config_files)
    for dag in ingestion_dags:
        print(dag)
        globals()[dag.dag_id] = create_data_ingestion_dag(dag.dag_id,
                                        dag.schedule,
                                        dag.default_args,
                                        dag.source_config,
                                        dag.processing_config,
                                        dag.destination_config
        )

# set up the relative path (to avoid using Airflow vars)
config_path=f"{removesuffix(os.getenv('DAGS_FOLDER', '/Users/prabhaarya/work/gcp-ingestion-framework/src/terraform/scripts-hydrated/dags'), 'dags')}data/common_layer/config/"

main(config_path)

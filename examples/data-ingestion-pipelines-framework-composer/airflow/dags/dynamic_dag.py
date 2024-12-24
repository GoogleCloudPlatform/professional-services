########################################################################
# DAG Description
########################################################################
# Process Name: dynamic dag creator

######################
# Purpose:
######################
# Automate the transfer of data from an SFTP location to a Google BigQuery dataset.

######################
# Functionality:
######################
# SFTP Connection: Establish a secure connection to the SFTP server.
# File Download: Download specified files from the SFTP location to a GCS bucket.
# Data Loading: Parse and load the downloaded data into a BigQuery table.
# File Archiving: If loading is successful, move the downloaded files to a GCS bucket archive folder. Otherwise, move them to an error folder.

# Note: Replace placeholders marked with #<Adjust> with appropriate values for your specific requirement.
########################################################################

from pathlib import PurePath

import pendulum
from airflow import DAG
from airflow.models.baseoperator import chain
from airflow.providers.google.cloud.operators.bigquery import BigQueryInsertJobOperator
from airflow.providers.google.cloud.operators.dataplex import (
    DataplexRunDataProfileScanOperator,
)
from airflow.providers.google.cloud.operators.dataplex import (
    DataplexRunDataQualityScanOperator,
)
from airflow.providers.google.cloud.transfers.sftp_to_gcs import SFTPToGCSOperator
from airflow.providers.sftp.sensors.sftp import SFTPSensor
from airflow.utils.task_group import TaskGroup

from configs.db_ingestion_config import DB_INGESTION_CONFIG
from configs.dlp_config import DLP_CONFIG
from configs.refined_ingestion_invalid_records_config import (
    REFINED_INGESTION_INVALID_RECORDS_CONFIG,
)
from configs.sftp_ingestion_config import FILE_INGESTION_CONFIG
from utils.db_ingestion_operator import get_db_ingestion_dataflow_operator
from utils.dlp_scan_task import create_dlp_scan
from utils.globals import DagsGlobals
from utils.sftp_tasks import generate_sftp_to_gcs_kwargs
from utils.sftp_to_raw_task_group import gcs_to_raw_bq
from utils.utils import empty_function_for_result_push, attach_tags
from utils.utils_tasks import (
    drop_line_breaks,
    read_sql_from_gcs,
    gcs_to_raw_completion_check,
)


# Helper function for dynamic DAG creation
def create_dag(dag_config):

    dag_id = dag_config["dag_id"]
    process_name = dag_config["dataset_name"]
    default_args = {
        "owner": "airflow",
        "start_date": pendulum.today("UTC").add(days=-1),
        "retries": 2,
    }

    # Define the DAG
    with DAG(
        dag_id=dag_id,
        default_args=default_args,
        schedule=dag_config["schedule"],
        catchup=False,
        max_active_runs=1,
        tags=dag_config.get("tags"),
    ) as dag:
        BQ_Project_Id = "{{var.value.bq_project_id}}"
        BQ_Dataset_Raw = f"{process_name}_raw".lower()
        BQ_Dataset_Refined = f"{process_name}_refined".lower()
        gcs_bucket = "{{var.value.gcs_bucket}}"
        dataset_name = dag_config["dataset_name"]
        drop_off_gcs_bucket = f"oq_dev_drop_off_{dataset_name}"
        data_lake_storage_bucket = f"oq_dev_data_lake_storage_raw_{dataset_name}"
        table_name_list = [t["table_name"] for t in dag_config["tables"]]
        # dataplex data quality scan start
        raw_dataplex_job_list = []
        refined_dataplex_job_list = []
        load_to_bq_refined_list = []
        sftp_to_dropoff_list = []

        for table_config in dag_config["tables"]:
            table_name = table_config["table_name"]
            # handling exception end
            if "sftp" in dag_config.get("tags"):
                with TaskGroup(
                    group_id=f"sftp-to-dropoff-{table_name}"
                ) as sftp_to_dropoff:
                    files_sensor_task = SFTPSensor(
                        task_id=f"sftp-sensor",
                        path=table_config.get(
                            "custom_sftp_dir",
                            PurePath(
                                dag_config["sftp_dataset_dir"], table_name
                            ).as_posix(),
                        ),
                        file_pattern=table_config.get("custom_file_pattern", "*"),
                        sftp_conn_id="ooredoo_sftp_dev",
                        python_callable=empty_function_for_result_push,
                        # During development wi will set this value to "2024-01-01" to copy
                        # all files from SFTP server, as nobody is pushing new files into
                        # dev SFTP server.
                        newer_than=(
                            "1900-01-01"
                            if DagsGlobals.development_flag
                            else "{{ data_interval_start }}"
                        ),
                        soft_fail=True,
                        timeout=0,
                        poke_interval=0,
                    )
                    sftp_to_gcs_kwargs = generate_sftp_to_gcs_kwargs(
                        sftp_sensor_output=files_sensor_task.output,
                        dataset_name=dataset_name,
                        table_name=table_name,
                    )
                    sftp_to_gcs_task = SFTPToGCSOperator.partial(
                        task_id=f"move-file-sftp-to-gcs",
                        destination_bucket=drop_off_gcs_bucket,
                        sftp_conn_id="ooredoo_sftp_dev",
                        move_object=False,
                    ).expand_kwargs(sftp_to_gcs_kwargs)

                    files_sensor_task >> sftp_to_gcs_kwargs >> sftp_to_gcs_task
                sftp_to_dropoff_list.append(sftp_to_dropoff)

        load_to_bq_tasks = []
        gcs_to_raw_checks_tasks = []
        for i, table_name in enumerate(table_name_list):
            if dag_config.get("database_type") in ("oracle", "teradata"):
                with TaskGroup(
                    f"db_ingestion_in_{table_name}"
                ) as db_ingestion_task_group:
                    sql_path = f"sql/db_ingestion_fetch_queries/{dataset_name}/{table_name}.sql"
                    gcs_query = read_sql_from_gcs(gcs_bucket, sql_path)
                    db_query = drop_line_breaks(gcs_query)
                    get_db_ingestion_dataflow_operator(
                        database_type=dag_config["database_type"],
                        db_dataset=dag_config["db_dataset"],
                        query=db_query,
                        destination_bq_uri=f"{BQ_Project_Id}:{BQ_Dataset_Raw}.{table_name}",
                        table_name=table_name,
                    )
                load_to_bq_tasks.append(db_ingestion_task_group)
            else:
                gcs_to_raw_task_group = (
                    gcs_to_raw_bq.override(group_id=f"gcs_to_raw_in_{table_name}")
                    .partial(
                        dag_config=dag_config,
                        BQ_Dataset_Raw=BQ_Dataset_Raw,
                        process_name=dataset_name,
                        gcs_bucket=gcs_bucket,
                        drop_off_gcs_bucket=drop_off_gcs_bucket,
                        data_lake_storage_bucket=data_lake_storage_bucket,
                        table_name=table_name,
                    )
                    .expand(
                        sftp_to_gcs_kwargs=sftp_to_dropoff_list[i]
                        .get_child_by_label("generate_sftp_to_gcs_kwargs")
                        .output
                    )
                )

                gcs_to_raw_completion_check_task = gcs_to_raw_completion_check.override(
                    task_id=f"gcs_to_raw_completion_check_{table_name}"
                )(
                    task_id_to_check=f"{gcs_to_raw_task_group.group_id}.insert_query_job_to_raw_table",
                    sftp_sensor_output=sftp_to_dropoff_list[i]
                    .get_child_by_label("sftp-sensor")
                    .output,
                )
                load_to_bq_tasks.append(gcs_to_raw_task_group)
                gcs_to_raw_checks_tasks.append(gcs_to_raw_completion_check_task)

        for table_config in dag_config["tables"]:
            table_name = table_config["table_name"]
            with TaskGroup(
                group_id=f"governance_raw_zone_{table_name}"
            ) as dataplex_raw_scans_group:
                if table_config.get("run_data_quality_scan"):
                    DataplexRunDataQualityScanOperator(
                        task_id=f"data_quality_scan",
                        project_id=DagsGlobals.governance_project_id,
                        region=DagsGlobals.location,
                        data_scan_id=f"data-scan-id-{table_name}_quality_scan".replace(
                            "_", "-"
                        ),
                        asynchronous=True,
                    )
                DataplexRunDataProfileScanOperator(
                    task_id=f"data_profile_scan",
                    project_id=DagsGlobals.governance_project_id,
                    region=DagsGlobals.location,
                    data_scan_id=f"data-scan-id-{table_name}_ps-raw".replace(
                        "_", "-"
                    ),
                    asynchronous=True,
                )

                create_dlp_scan.override(task_id="data_loss_prevention_scan")(
                    dataset_id=BQ_Dataset_Raw,
                    table_id=table_name,
                    excluded_columns=DLP_CONFIG.get(dataset_name, {})
                    .get(table_name, {})
                    .get("pii_columns"),
                )

            raw_dataplex_job_list.append(dataplex_raw_scans_group)

            with TaskGroup(
                group_id=f"bq_raw_to_refined_task_group_{table_name}"
            ) as bq_raw_to_refined_task_group:
                invalid_records_clause = REFINED_INGESTION_INVALID_RECORDS_CONFIG.get(
                    dataset_name, {}
                ).get(table_name, {})
                if table_config.get("run_data_quality_scan") and invalid_records_clause:
                    refined_table_query = f"""
                            INSERT INTO `{BQ_Project_Id}.{BQ_Dataset_Refined}.{table_name}`
                            SELECT * FROM `{BQ_Project_Id}.{BQ_Dataset_Raw}.{table_name}`
                            WHERE NOT ({invalid_records_clause}) and processing_dttm = TIMESTAMP "{{{{ data_interval_end }}}}";
                         """
                    error_table_query = f"""
                            INSERT INTO `{BQ_Project_Id}.data_quality_output.error_{dataset_name}_{table_name}`
                            SELECT * FROM `{BQ_Project_Id}.{BQ_Dataset_Raw}.{table_name}`
                            WHERE ({invalid_records_clause}) and processing_dttm = TIMESTAMP "{{{{ data_interval_end }}}}";
                        """
                else:
                    refined_table_query = f"""              
                        INSERT INTO `{BQ_Project_Id}.{BQ_Dataset_Refined}.{table_name}`
                        SELECT *
                        FROM `{BQ_Project_Id}.{BQ_Dataset_Raw}.{table_name}`
                        where processing_dttm = TIMESTAMP "{{{{ data_interval_end }}}}";
                    """
                    error_table_query = None

                BigQueryInsertJobOperator(
                    task_id=f"ingest_raw_to_refined_table",
                    configuration={
                        "query": {
                            "query": refined_table_query,
                            "useLegacySql": False,
                            "priority": "BATCH",
                        }
                    },
                    location=DagsGlobals.location,
                    project_id=DagsGlobals.processing_project_id,
                    trigger_rule="all_success",
                    deferrable=True,
                )

                if table_config.get("run_data_quality_scan") and invalid_records_clause:
                    BigQueryInsertJobOperator(
                        task_id=f"ingest_invalid_records",
                        configuration={
                            "query": {
                                "query": error_table_query,
                                "useLegacySql": False,
                                "priority": "BATCH",
                            }
                        },
                        location=DagsGlobals.location,
                        project_id=DagsGlobals.processing_project_id,
                        trigger_rule="all_success",
                        deferrable=True,
                    )

            load_to_bq_refined_list.append(bq_raw_to_refined_task_group)

            table_name = table_config["table_name"]
            with TaskGroup(
                group_id=f"governance_refined_zone_{table_name}"
            ) as dataplex_refined_scans_group:
                DataplexRunDataProfileScanOperator(
                        task_id=f"data_profile_scan",
                        project_id=DagsGlobals.governance_project_id,
                        region=DagsGlobals.location,
                        data_scan_id=f"data-scan-id-{table_name}_ps-refined".replace(
                            "_", "-"
                        ),
                        asynchronous=True,
                    )

            refined_dataplex_job_list.append(dataplex_refined_scans_group)
        # Setting task dependencies

        if "sftp" in dag_config.get("tags"):
            chain(
                sftp_to_dropoff_list,
                load_to_bq_tasks,
                gcs_to_raw_checks_tasks,
                raw_dataplex_job_list,
                load_to_bq_refined_list,
                refined_dataplex_job_list,
            )
        else:
            chain(
                load_to_bq_tasks,
                raw_dataplex_job_list,
                load_to_bq_refined_list,
                refined_dataplex_job_list,
            )
    return dag


# Generate a DAG for each configuration in the Confid file
for config in [
    *attach_tags(FILE_INGESTION_CONFIG),
    *attach_tags(DB_INGESTION_CONFIG),
]:
    create_dag(config)

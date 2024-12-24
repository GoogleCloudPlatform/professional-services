from airflow.decorators import task_group
from airflow.providers.google.cloud.operators.bigquery import BigQueryInsertJobOperator
from airflow.providers.google.cloud.operators.dataflow import (
    DataflowStartFlexTemplateOperator,
)
from airflow.providers.google.cloud.transfers.gcs_to_gcs import GCSToGCSOperator

from utils.globals import DagsGlobals
from utils.sftp_tasks import prepare_paths, archive_input_file, copy_gcs_blob
from utils.utils_tasks import read_sql_from_gcs, inject_table_names


@task_group
def gcs_to_raw_bq(
    dag_config,
    BQ_Dataset_Raw,
    process_name,
    gcs_bucket,
    drop_off_gcs_bucket,
    data_lake_storage_bucket,
    table_name,
    sftp_to_gcs_kwargs,
):

    prepared_paths = prepare_paths(
        dag_config=dag_config,
        dataset_name=process_name,
        table_name=table_name,
        sftp_to_gcs_kwargs=sftp_to_gcs_kwargs,
        drop_off_gcs_bucket=drop_off_gcs_bucket,
    )

    move_to_staging_task = copy_gcs_blob.override(task_id="move_to_staging")(
        blob_name=prepared_paths["landing_file_path"],
        bucket_name=drop_off_gcs_bucket,
        destination_blob_name=prepared_paths["staging_file_path"],
        destination_bucket_name=drop_off_gcs_bucket,
        move=True,
    )

    # dataflow job to clean start
    if dag_config["is_preprocesseing_required"]:
        start_escape_quotes_job_task = DataflowStartFlexTemplateOperator(
            task_id=f"start_escape_quotes_job",
            project_id="{{var.value.processing_project_id}}",
            body={
                "launchParameter": {
                    "jobName": "escape-quotes-job",
                    "parameters": {
                        "input": prepared_paths["preprocessing_input_dataflow"],
                        "output": prepared_paths["preprocessing_output_dataflow"],
                    },
                    "environment": {
                        "tempLocation": "gs://{{var.value.processing_project_id}}-dataflow-temp/temp",
                        "stagingLocation": "gs://{{var.value.processing_project_id}}-dataflow-temp/staging",
                        "sdkContainerImage": f"{DagsGlobals.location}-docker.pkg.dev/{{{{var.value.processing_project_id}}}}/default-docker-repository/escape-quotes:latest",
                    },
                    "containerSpecGcsPath": "gs://{{var.value.processing_project_id}}-dataflow-artifacts/templates/escape_quotes.json",
                }
            },
            location=DagsGlobals.location,
            append_job_name=True,
            deferrable=True,
            poll_sleep=30,
        )

    sql_content = read_sql_from_gcs(gcs_bucket, prepared_paths["sql_path"])
    query = inject_table_names(
        sql_content,
        project="{{var.value.bq_project_id}}",
        dataset_raw=BQ_Dataset_Raw,
        base_file_name=prepared_paths["base_file_name"],
        folder_or_table_name=table_name,
        file_uri=prepared_paths["bq_load_uri"],
    )

    load_to_bq_task = BigQueryInsertJobOperator(
        task_id=f"insert_query_job_to_raw_table",
        configuration={
            "query": {
                "query": query,
                "useLegacySql": False,
                "priority": "BATCH",
            }
        },
        location=DagsGlobals.location,
        project_id="{{var.value.processing_project_id}}",
        deferrable=True,
    )

    archive_input_file_task = archive_input_file(
        drop_off_bucket_name=drop_off_gcs_bucket,
        data_lake_storage_bucket_name=data_lake_storage_bucket,
        blob_name=prepared_paths["staging_file_path"],
        archive_destination_blob_name=prepared_paths["archive_file_path"],
        error_destination_blob_name=prepared_paths["error_file_path"],
        load_job_task_id=load_to_bq_task.task_id,
    )

    if dag_config["is_preprocesseing_required"]:
        execution_order = (
            prepared_paths >> move_to_staging_task >> start_escape_quotes_job_task
        )
    else:
        execution_order = prepared_paths >> move_to_staging_task
    (
        execution_order
        >> sql_content
        >> query
        >> load_to_bq_task
        >> archive_input_file_task
    )

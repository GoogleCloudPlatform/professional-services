import logging
import os
from pathlib import PurePath

from airflow.decorators import task
from airflow.models import TaskInstance, DagRun
from airflow.utils.state import TaskInstanceState
from airflow.utils.trigger_rule import TriggerRule
from six import moves


@task(multiple_outputs=True)
def prepare_paths(
    dag_config, dataset_name, table_name, sftp_to_gcs_kwargs, drop_off_gcs_bucket
):
    gcs_file_path = sftp_to_gcs_kwargs["destination_path"]
    base = PurePath(gcs_file_path).name
    base_file_name = base.replace(".", "_")
    staging_file_path = f"{table_name}/Staging/{base_file_name}/{base}"
    if dag_config["is_preprocesseing_required"] == True:
        preprocessing_dependent_paths = {
            "preprocessing_input_dataflow": f"gs://{drop_off_gcs_bucket}/{staging_file_path}",
            "preprocessing_output_dataflow": f"gs://{drop_off_gcs_bucket}/{table_name}/DataflowOutputs/{base_file_name}/{base}",
            "bq_load_uri": f"gs://{drop_off_gcs_bucket}/{table_name}/DataflowOutputs/{base_file_name}/",
        }
    else:
        preprocessing_dependent_paths = {
            "bq_load_uri": f"gs://{drop_off_gcs_bucket}/{staging_file_path}",
        }
    return {
        "landing_file_path": f"{table_name}/Landing/{base}",
        "staging_file_path": staging_file_path,
        "archive_file_path": f"{table_name}/Archive/{base}",
        "error_file_path": f"{table_name}/Error/{base}",
        "base_file_name": base_file_name,
        "sql_path": f"sql/dml/{dataset_name}/{table_name}.sql",
        **preprocessing_dependent_paths,
    }


@task
def get_archive_kwargs(dir_files, table_name, destination_path, source_path):
    return [
        {
            "source_object": f"{source_path}/{file_name}",
            "destination_object": f"{destination_path}{os.path.basename(file_name)}",
        }
        for file_name in dir_files[table_name]
    ]


@task(trigger_rule=TriggerRule.ALL_DONE)
def archive_input_file(
    drop_off_bucket_name,
    blob_name,
    data_lake_storage_bucket_name,
    archive_destination_blob_name,
    error_destination_blob_name,
    load_job_task_id,
    task_instance: TaskInstance | None = None,
    dag_run: DagRun | None = None,
):
    load_job_state = dag_run.get_task_instance(
        task_id=load_job_task_id, map_index=task_instance.map_index
    ).current_state()
    if load_job_state == TaskInstanceState.SUCCESS:
        destination_blob_name = archive_destination_blob_name
        logging.info(
            f"Valid Ingestion. Archiving to: gs://{drop_off_bucket_name}/{destination_blob_name}"
        )
    else:
        destination_blob_name = error_destination_blob_name
        logging.warning(
            f"Invalid Ingestion. Archiving to: gs://{drop_off_bucket_name}/{destination_blob_name}"
        )

    copy_gcs_blob.function(
        blob_name=blob_name,
        bucket_name=drop_off_bucket_name,
        destination_blob_name=destination_blob_name,
        destination_bucket_name=drop_off_bucket_name,
    )

    copy_gcs_blob.function(
        blob_name=blob_name,
        bucket_name=drop_off_bucket_name,
        destination_blob_name=destination_blob_name,
        destination_bucket_name=data_lake_storage_bucket_name,
        move=True,
    )


@task
def copy_gcs_blob(
    blob_name,
    bucket_name,
    destination_blob_name,
    destination_bucket_name,
    move=False,
):
    from google.cloud import storage

    storage_client = storage.Client()
    source_bucket = storage_client.bucket(bucket_name)
    source_blob = source_bucket.blob(blob_name)
    destination_bucket = storage_client.bucket(destination_bucket_name)
    blob_copy = source_bucket.copy_blob(
        source_blob,
        destination_bucket,
        destination_blob_name,
    )
    print(
        "Blob {} in bucket {} copied as blob {} in bucket {}.".format(
            source_blob.name,
            source_bucket.name,
            blob_copy.name,
            destination_bucket.name,
        )
    )
    if move:
        source_bucket.delete_blob(blob_name)


@task
def generate_sftp_to_gcs_kwargs(
    sftp_sensor_output: dict[str, list[str]], dataset_name: str, table_name: str
) -> list[dict[str, str]]:
    return [
        {
            "source_path": sftp_filepath,
            "destination_path": PurePath(
                table_name, "Landing", PurePath(sftp_filepath).name
            ).as_posix(),
        }
        for sftp_filepath in sftp_sensor_output["files_found"]
    ]

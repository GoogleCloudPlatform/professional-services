import logging
from typing import Optional

from airflow.decorators import task
from airflow.exceptions import AirflowFailException
from airflow.models import DagRun
from airflow.utils.state import TaskInstanceState
from pendulum import datetime

from utils.globals import DagsGlobals


@task
def inject_table_names(
    string: str,
    project: str,
    dataset_raw: str,
    base_file_name: str,
    folder_or_table_name: str,
    file_uri: str,
    data_interval_end: Optional[datetime] = None,
):
    return (
        string.replace("{BQ_Project_Id}", project)
        .replace("{BQ_Dataset_Raw}", dataset_raw)
        .replace("{base_file_name}", base_file_name)
        .replace("{folder_or_table_name}", folder_or_table_name)
        .replace("{file_uri}", file_uri)
        .replace(
            "{data_interval_end}",
            data_interval_end.format(DagsGlobals.pendulum_date_format),
        )
    )


@task
def read_sql_from_gcs(bucket_name, sql_path):
    """Reads an SQL file from GCS and returns its contents as a string.
    Args:
        bucket_name (str): The name of the GCS bucket.
        sql_path (str): The path to the SQL file within the bucket.
    Returns:
        str: The contents of the SQL file as a string.
    """
    # Local import for faster DAG parsing
    from google.cloud import storage

    # Instantiate a Google Cloud Storage client
    storage_client = storage.Client()

    # Get the bucket object
    bucket = storage_client.get_bucket(bucket_name)

    # Get the blob object for the specific file
    blob = bucket.blob(sql_path)

    # Download the contents of the blob as a string
    sql_content = blob.download_as_string().decode("utf-8")
    return sql_content


@task
def drop_line_breaks(_input: str, data_interval_end: Optional[datetime] = None):
    return _input.replace("\n", " ").replace(
        "{data_interval_end}",
        data_interval_end.format(DagsGlobals.pendulum_date_format),
    )


@task
def gcs_to_raw_completion_check(
    task_id_to_check: str, sftp_sensor_output: dict, dag_run: DagRun | None = None
):
    job_states = [
        dag_run.get_task_instance(
            task_id=task_id_to_check, map_index=map_index
        ).current_state()
        for map_index in range(len(sftp_sensor_output["files_found"]))
    ]
    success_indexes = [
        i for i, s in enumerate(job_states) if s == TaskInstanceState.SUCCESS
    ]
    failed_indexes = [
        i for i, s in enumerate(job_states) if s != TaskInstanceState.SUCCESS
    ]

    logging.info(f"failed_indexes={failed_indexes} ; success_indexes={success_indexes}")

    if len(success_indexes) <= 0:
        raise AirflowFailException(
            f"All mapped tasks failed in task_id={task_id_to_check}"
        )
    logging.info(f"At least one of mapped tasks succeeded. task_id={task_id_to_check}")

# -------------------------------------------------
# Base Taskflow Imports
# -------------------------------------------------

# -------------------------------------------------
# Google Cloud Taskflow Imports
# -------------------------------------------------
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator
from airflow.operators.python import (
    BranchPythonOperator,
    PythonOperator,
)
from airflow.providers.apache.beam.hooks.beam import BeamRunnerType
from airflow.providers.apache.beam.operators.beam import BeamRunJavaPipelineOperator
from airflow.providers.cncf.kubernetes.operators.pod import KubernetesPodOperator
from airflow.providers.google.cloud.operators.bigquery import (
    BigQueryCreateEmptyDatasetOperator,
    BigQueryDeleteDatasetOperator,
    BigQueryInsertJobOperator,
)
from airflow.providers.google.cloud.operators.dataproc import (
    DataprocCreateBatchOperator,
    DataprocCreateClusterOperator,
    DataprocDeleteClusterOperator,
    DataprocSubmitJobOperator,
)
from airflow.providers.google.cloud.operators.gcs import (
    GCSCreateBucketOperator,
    GCSDeleteBucketOperator,
)
from airflow.providers.google.cloud.operators.kubernetes_engine import (
    GKECreateClusterOperator,
    GKEDeleteClusterOperator,
    GKEStartPodOperator,
)
from airflow.providers.google.cloud.transfers.gcs_to_bigquery import (
    GCSToBigQueryOperator,
)
from airflow.providers.google.cloud.transfers.gcs_to_gcs import GCSToGCSOperator

# -------------------------------------------------
# Begin DAG
# -------------------------------------------------

with DAG(
    dag_id="sample_dag_0",
    description="This DAG was auto-generated for experimentation purposes.",
    schedule="50 * * * *",
    default_args={
        "retries": 1,
        "retry_delay": timedelta(minutes=2),
        "execution_timeout": timedelta(minutes=30),
        "sla": timedelta(minutes=25),
        "deferrable": False,
    },
    start_date=datetime.strptime("9/20/2024", "%m/%d/%Y"),
    catchup=False,
    dagrun_timeout=timedelta(minutes=60),
    is_paused_upon_creation=False,
    tags=["generated_workload", "sample"],
) as dag:
    # -------------------------------------------------
    # Default DataprocBatchOperator Taskflow
    # -------------------------------------------------

    batch_id = "sample_dag_0-0-batch".replace("_", "-")
    batch_config = {
        "spark_batch": {
            "jar_file_uris": ["file:///usr/lib/spark/examples/jars/spark-examples.jar"],
            "main_class": "org.apache.spark.examples.SparkPi",
        }
    }
    task_0 = DataprocCreateBatchOperator(
        task_id="create_batch_0",
        project_id="your-project",
        region="your-region",
        batch_id=batch_id,
        batch=batch_config,
    )

    # -------------------------------------------------
    # Default EmptyOperator Taskflow
    # -------------------------------------------------

    task_1 = EmptyOperator(
        task_id=f"empty_task_1",
    )

    # -------------------------------------------------
    # Default EmptyOperator Taskflow
    # -------------------------------------------------

    task_2 = EmptyOperator(
        task_id=f"empty_task_2",
    )

    # -------------------------------------------------
    # Default EmptyOperator Taskflow
    # -------------------------------------------------

    task_3 = EmptyOperator(
        task_id=f"empty_task_3",
    )

    # -------------------------------------------------
    # Default PythonOperator Taskflow
    # -------------------------------------------------

    task_4 = PythonOperator(
        task_id="python_4",
        python_callable=lambda: print(f"Hello World from DAG: sample_dag_0, Task: 4"),
    )

    # -------------------------------------------------
    # Default PythonOperator Taskflow
    # -------------------------------------------------

    task_5 = PythonOperator(
        task_id="python_5",
        python_callable=lambda: print(f"Hello World from DAG: sample_dag_0, Task: 5"),
    )

    # -------------------------------------------------
    # Default BigQueryInsertJobOperator Taskflow
    # -------------------------------------------------

    task_6 = BigQueryInsertJobOperator(
        task_id="bigquery_insert_job_6",
        configuration={
            "query": {
                "query": "SELECT 1",
                "useLegacySql": False,
            }
        },
        location="your-region",
    )

    # -------------------------------------------------
    # Default BigQueryInsertJobOperator Taskflow
    # -------------------------------------------------

    task_7 = BigQueryInsertJobOperator(
        task_id="bigquery_insert_job_7",
        configuration={
            "query": {
                "query": "SELECT 1",
                "useLegacySql": False,
            }
        },
        location="your-region",
    )

    # -------------------------------------------------
    # Default DataprocBatchOperator Taskflow
    # -------------------------------------------------

    batch_id = "sample_dag_0-8-batch".replace("_", "-")
    batch_config = {
        "spark_batch": {
            "jar_file_uris": ["file:///usr/lib/spark/examples/jars/spark-examples.jar"],
            "main_class": "org.apache.spark.examples.SparkPi",
        }
    }
    task_8 = DataprocCreateBatchOperator(
        task_id="create_batch_8",
        project_id="your-project",
        region="your-region",
        batch_id=batch_id,
        batch=batch_config,
    )

    # -------------------------------------------------
    # Default EmptyOperator Taskflow
    # -------------------------------------------------

    task_9 = EmptyOperator(
        task_id=f"empty_task_9",
    )

    (
        task_0
        >> task_1
        >> task_2
        >> task_3
        >> task_4
        >> task_5
        >> task_6
        >> task_7
        >> task_8
        >> task_9
    )

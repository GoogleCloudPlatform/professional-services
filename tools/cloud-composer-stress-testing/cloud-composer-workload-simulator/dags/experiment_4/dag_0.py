

# -------------------------------------------------
# Base Taskflow Imports 
# -------------------------------------------------

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import (
    PythonOperator,
    BranchPythonOperator,
)
from airflow.providers.cncf.kubernetes.operators.kubernetes_pod import KubernetesPodOperator
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator

# -------------------------------------------------
# Google Cloud Taskflow Imports 
# -------------------------------------------------

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import (
    PythonOperator,
)
from airflow.providers.google.cloud.operators.dataproc import (
    DataprocCreateClusterOperator,
    DataprocDeleteClusterOperator,
    DataprocSubmitJobOperator,
    DataprocCreateBatchOperator,
)
from airflow.providers.apache.beam.hooks.beam import BeamRunnerType
from airflow.providers.apache.beam.operators.beam import BeamRunJavaPipelineOperator
from airflow.providers.google.cloud.operators.gcs import (
    GCSCreateBucketOperator,
    GCSDeleteBucketOperator,
)
from airflow.providers.google.cloud.transfers.gcs_to_gcs import (
    GCSToGCSOperator
)
from airflow.providers.google.cloud.operators.bigquery import (
    BigQueryCreateEmptyDatasetOperator,
    BigQueryDeleteDatasetOperator,
    BigQueryInsertJobOperator
)
from airflow.providers.google.cloud.transfers.gcs_to_bigquery import (
    GCSToBigQueryOperator,
)
from airflow.providers.google.cloud.operators.kubernetes_engine import (
    GKECreateClusterOperator,
    GKEDeleteClusterOperator,
    GKEStartPodOperator,
)


# -------------------------------------------------
# Begin DAG
# -------------------------------------------------

with DAG(
    dag_id="experiment_4_dag_0",
    description="This DAG was auto-generated for experimentation purposes.",
    schedule="@daily",
    default_args={
        "retries": 1,
        "retry_delay": timedelta(minutes=2),
        "execution_timeout": timedelta(minutes=30),
        "sla": timedelta(minutes=25),
        "deferrable": True,
    },
    start_date=datetime.strptime("9/20/2024", "%m/%d/%Y"),
    catchup=False,
    dagrun_timeout=timedelta(minutes=60),
    is_paused_upon_creation=False,
    tags=['load_simulation', 'experiment_4']
) as dag:


    # -------------------------------------------------
    # Default EmptyOperator Taskflow 
    # -------------------------------------------------

    task_0 = EmptyOperator(
        task_id=f"empty_task_0",
    )
    
    # -------------------------------------------------
    # Default BashOperator Taskflow 
    # -------------------------------------------------

    task_1 = BashOperator(
        task_id="bash_task_1",
        bash_command="echo 'Hello from BashOperator'",
    )
    
    # -------------------------------------------------
    # Default BigQueryInsertJobOperator Taskflow 
    # -------------------------------------------------
        
    task_2 = BigQueryInsertJobOperator(
        task_id="bigquery_insert_job_2",
        configuration={
            "query": {
                "query": "SELECT 1",
                "useLegacySql": False,
            }
        },
        location="us-central1",
    )
    
    # -------------------------------------------------
    # Default PythonOperator Taskflow 
    # -------------------------------------------------
        
    task_3 = PythonOperator(
        task_id="python_3",
        python_callable=lambda: print(f"Hello World from DAG: experiment_4_dag_0, Task: 3"),
    )
    
    # -------------------------------------------------
    # Default BigQueryInsertJobOperator Taskflow 
    # -------------------------------------------------
        
    task_4 = BigQueryInsertJobOperator(
        task_id="bigquery_insert_job_4",
        configuration={
            "query": {
                "query": "SELECT 1",
                "useLegacySql": False,
            }
        },
        location="us-central1",
    )
    
    # -------------------------------------------------
    # Default EmptyOperator Taskflow 
    # -------------------------------------------------

    task_5 = EmptyOperator(
        task_id=f"empty_task_5",
    )
    
    # -------------------------------------------------
    # Default EmptyOperator Taskflow 
    # -------------------------------------------------

    task_6 = EmptyOperator(
        task_id=f"empty_task_6",
    )
    
    # -------------------------------------------------
    # Default EmptyOperator Taskflow 
    # -------------------------------------------------

    task_7 = EmptyOperator(
        task_id=f"empty_task_7",
    )
    
    # -------------------------------------------------
    # Default EmptyOperator Taskflow 
    # -------------------------------------------------

    task_8 = EmptyOperator(
        task_id=f"empty_task_8",
    )
    
    # -------------------------------------------------
    # Default BigQueryInsertJobOperator Taskflow 
    # -------------------------------------------------
        
    task_9 = BigQueryInsertJobOperator(
        task_id="bigquery_insert_job_9",
        configuration={
            "query": {
                "query": "SELECT 1",
                "useLegacySql": False,
            }
        },
        location="us-central1",
    )
    
    task_0 >> task_1 >> task_2 >> task_3 >> task_4 >> task_5 >> task_6 >> task_7 >> task_8 >> task_9

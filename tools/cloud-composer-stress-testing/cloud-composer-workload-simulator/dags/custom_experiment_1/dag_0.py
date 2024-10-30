
# -------------------------------------------------
# Custom Taskflow Imports 
# -------------------------------------------------

import time
from datetime import datetime, timedelta
from google.cloud import storage
from airflow import DAG
from airflow.operators.python import (
    PythonOperator,
)
from airflow.providers.google.cloud.operators.dataproc import (
    DataprocCreateClusterOperator,
    DataprocDeleteClusterOperator,
    DataprocSubmitJobOperator,
)
from airflow.providers.google.cloud.operators.gcs import (
    GCSCreateBucketOperator,
    GCSDeleteBucketOperator,
    GCSListObjectsOperator,
    GCSDeleteObjectsOperator
)
from airflow.providers.google.cloud.sensors.gcs import (
    GCSObjectExistenceSensor
)
from airflow.providers.google.cloud.hooks.gcs import GCSHook


# -------------------------------------------------
# Begin DAG
# -------------------------------------------------

with DAG(
    dag_id="custom_experiment_1_dag_0",
    description="This DAG was auto-generated for experimentation purposes.",
    schedule="@daily",
    default_args={
        "retries": 1,
        "retry_delay": timedelta(minutes=2),
        "execution_timeout": timedelta(minutes=30),
        "sla": timedelta(minutes=25),
        "deferrable": True,
    },
    start_date=datetime.strptime("9/24/2024", "%m/%d/%Y"),
    catchup=False,
    dagrun_timeout=timedelta(minutes=60),
    is_paused_upon_creation=False,
    tags=['load_simulation', 'custom_experiment_1']
) as dag:


    # -------------------------------------------------
    # Custom Data Pipeline Taskflow 
    # -------------------------------------------------

    def write_to_gcs(bucket_name, object_path, contents):
        gcs_hook = GCSHook()
        gcs_hook.upload(
            bucket_name=bucket_name,
            object_name=object_path,
            data=contents.encode(
                "utf-8"
            ), 
        )
    
    cluster_name = "custom_experiment_1_dag_0-0".replace("_", "-")
    bucket_name = bucket = "custom_experiment_1_dag_0-0".replace('_','-')
    object_path = f"custom_experiment_1_dag_0/0/sample"

    create_bucket_0 = GCSCreateBucketOperator(
        task_id="create_bucket_0", bucket_name=bucket
    )

    is_ready_0 = GCSObjectExistenceSensor(
        task_id="is_ready_0",
        bucket=bucket_name,
        object=f"{object_path}/hello.txt",
        mode='poke',
        poke_interval=30,
        timeout=360
    )    

    delay_python_task_0 = PythonOperator(
        task_id="delay_python_task_0",
        python_callable=lambda: time.sleep(180)
    )

    upload_sample_txt_0 = PythonOperator(
        task_id='upload_sample_txt_0',
        python_callable=write_to_gcs,
        op_args=[bucket_name, f"{object_path}/hello.txt", "hello world"]
    )


    list_objects_with_prefix_0 = GCSListObjectsOperator(
        task_id="list_objects_with_prefix_0",
        bucket=bucket_name,
        prefix=f"custom_experiment_1_dag_0/0/sample/"
    )

    delete_objects_with_prefix_0 = GCSDeleteObjectsOperator(
        task_id="delete_objects_with_prefix_0",
        bucket_name=bucket_name,
        prefix=f"custom_experiment_1_dag_0/0/sample/"
    )

    touch_DONE_0 = PythonOperator(
        task_id='touch_DONE_0',
        python_callable=write_to_gcs,
        op_args=[bucket_name, f"custom_experiment_1_dag_0/0/_DONE", "done"]
    )

    create_cluster_0 = DataprocCreateClusterOperator(
        task_id="create_cluster_0",
        project_id='cy-artifacts',
        cluster_config={
            "master_config": {
                "num_instances": 1,
                "machine_type_uri": "n1-standard-4",
                "disk_config": {"boot_disk_type": "pd-standard", "boot_disk_size_gb": 32},
            },
            "lifecycle_config": {
                    "idle_delete_ttl": "300s"
            }
        },
        region='us-central1',
        cluster_name=cluster_name,
    )

    task_0 = DataprocSubmitJobOperator(
        task_id="task_0",
        job={
            "reference": {"project_id": 'cy-artifacts'},
            "placement": {"cluster_name": cluster_name},
            "hive_job": {"query_list": {"queries": ["SHOW DATABASES;"]}},
        },
        region='us-central1',
        project_id='cy-artifacts',
    )
    delete_cluster_0 = DataprocDeleteClusterOperator(
        task_id="delete_cluster_0",
        project_id='cy-artifacts',
        cluster_name=cluster_name,
        region='us-central1',
        trigger_rule="all_done",
    )

    delete_bucket_0 = GCSDeleteBucketOperator(
        task_id="delete_bucket_0",
        bucket_name=bucket_name,
        trigger_rule="all_done",
    )

    create_bucket_0 >> is_ready_0 >> list_objects_with_prefix_0 >> delete_objects_with_prefix_0 >> create_cluster_0 >> task_0 >> touch_DONE_0 >> [delete_bucket_0, delete_cluster_0]
    delay_python_task_0 >> upload_sample_txt_0
    
    task_0

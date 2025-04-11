# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Custom Taskflow class for default google task Taskflows.
"""

from taskflow_collections.base_taskflows import BaseTaskFlows


class CustomTaskFlows(BaseTaskFlows):
    """
    Custom TaskFlow class with default functions for DAG generation.
    """

    def __init__(self, dag_id, region, project_id):
        """
        Custom
        """
        super().__init__(dag_id)
        self.region = region
        self.project_id = project_id

        self.taskflows = ["CustomDataPipeline"]

    @staticmethod
    def add_imports():
        """generate string fo default imports"""

        imports = f"""
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
"""
        return imports

    def generate_tasks(self, task_number, taskflow_name) -> str:
        """ """
        tasks_string = ""
        if taskflow_name == "CustomDataPipeline":
            tasks_string = self.customdatapipeline_taskflow(task_id=task_number)
        return tasks_string

    def customdatapipeline_taskflow(
        self,
        task_id: str,
    ):
        """Generates Taskflow for Custom Data Pipeline."""
        return f"""
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
    
    cluster_name = "{self.dag_id}-{task_id}".replace("_", "-")
    bucket_name = bucket = "{self.dag_id}-{task_id}".replace('_','-')
    object_path = f"{self.dag_id}/{task_id}/sample"

    create_bucket_{task_id} = GCSCreateBucketOperator(
        task_id="create_bucket_{task_id}", bucket_name=bucket
    )

    is_ready_{task_id} = GCSObjectExistenceSensor(
        task_id="is_ready_{task_id}",
        bucket=bucket_name,
        object=f"{{object_path}}/hello.txt",
        mode='poke',
        poke_interval=30,
        timeout=360
    )    

    delay_python_task_{task_id} = PythonOperator(
        task_id="delay_python_task_{task_id}",
        python_callable=lambda: time.sleep(180)
    )

    upload_sample_txt_{task_id} = PythonOperator(
        task_id='upload_sample_txt_{task_id}',
        python_callable=write_to_gcs,
        op_args=[bucket_name, f"{{object_path}}/hello.txt", "hello world"]
    )

    list_objects_with_prefix_{task_id} = GCSListObjectsOperator(
        task_id="list_objects_with_prefix_{task_id}",
        bucket=bucket_name,
        prefix=f"{self.dag_id}/{task_id}/sample/"
    )

    delete_objects_with_prefix_{task_id} = GCSDeleteObjectsOperator(
        task_id="delete_objects_with_prefix_{task_id}",
        bucket_name=bucket_name,
        prefix=f"{self.dag_id}/{task_id}/sample/"
    )

    touch_DONE_{task_id} = PythonOperator(
        task_id='touch_DONE_{task_id}',
        python_callable=write_to_gcs,
        op_args=[bucket_name, f"{self.dag_id}/{task_id}/_DONE", "done"]
    )

    create_cluster_{task_id} = DataprocCreateClusterOperator(
        task_id="create_cluster_{task_id}",
        project_id='{self.project_id}',
        cluster_config={{
            "master_config": {{
                "num_instances": 1,
                "machine_type_uri": "n1-standard-4",
                "disk_config": {{"boot_disk_type": "pd-standard", "boot_disk_size_gb": 32}},
            }},
            "lifecycle_config": {{
                    "idle_delete_ttl": "300s"
            }}
        }},
        region='{self.region}',
        cluster_name=cluster_name,
    )

    task_{task_id} = DataprocSubmitJobOperator(
        task_id="task_{task_id}",
        job={{
            "reference": {{"project_id": '{self.project_id}'}},
            "placement": {{"cluster_name": cluster_name}},
            "hive_job": {{"query_list": {{"queries": ["SHOW DATABASES;"]}}}},
        }},
        region='{self.region}',
        project_id='{self.project_id}',
    )
    delete_cluster_{task_id} = DataprocDeleteClusterOperator(
        task_id="delete_cluster_{task_id}",
        project_id='{self.project_id}',
        cluster_name=cluster_name,
        region='{self.region}',
        trigger_rule="all_done",
    )

    delete_bucket_{task_id} = GCSDeleteBucketOperator(
        task_id="delete_bucket_{task_id}",
        bucket_name=bucket_name,
        trigger_rule="all_done",
    )

    create_bucket_{task_id} >> is_ready_{task_id} >> list_objects_with_prefix_{task_id} >> delete_objects_with_prefix_{task_id} >> create_cluster_{task_id} >> task_{task_id} >> touch_DONE_{task_id} >> [delete_bucket_{task_id}, delete_cluster_{task_id}]
    delay_python_task_{task_id} >> upload_sample_txt_{task_id}
    """

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
Google Cloud TaskFlow class for default google task Taskflows.
"""

from taskflow_collections.base_taskflows import BaseTaskFlows


class GoogleCloudTaskFlows(BaseTaskFlows):
    """
    Google Cloud TaskFlow class with default functions for DAG generation.
    """

    def __init__(self, dag_id, region, project_id):
        """
        Google Cloud
        """
        super().__init__(dag_id)
        self.region = region
        self.project_id = project_id

        self.taskflows = [
            "BigQueryInsertJobOperator",
            "DataprocSubmitJobOperator",
            "BeamRunJavaPipelineOperator",
            "DataprocCreateBatchOperator",
            "GCSToGCSOperator",
            "GCSToBigQueryOperator",
            "GKEStartPodOperator",
        ]

    @staticmethod
    def add_imports():
        """generate string fo default imports"""

        imports = f"""
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
"""
        return imports

    def generate_tasks(self, task_number, taskflow_name) -> str:
        """ """
        tasks_string = ""
        if taskflow_name == "BigQueryInsertJobOperator":
            tasks_string = self.bigqueryinsertjoboperator_taskflow(task_id=task_number)

        elif taskflow_name == "DataprocSubmitJobOperator":
            tasks_string = self.dataprocsubmitjoboperator_taskflow(task_id=task_number)

        elif taskflow_name == "BeamRunJavaPipelineOperator":
            tasks_string = self.beamrunjavapipelineoperator_taskflow(
                task_id=task_number
            )

        elif taskflow_name == "DataprocCreateBatchOperator":
            tasks_string = self.dataprocbatchoperator_taskflow(task_id=task_number)

        elif taskflow_name == "GCSToGCSOperator":
            tasks_string = self.gcstogcsoperator_taskflow(task_id=task_number)

        elif taskflow_name == "GCSToBigQueryOperator":
            tasks_string = self.gcstobigqueryoperator_taskflow(task_id=task_number)

        elif taskflow_name == "GKEStartPodOperator":
            tasks_string = self.gkestartpodoperator_taskflow(task_id=task_number)

        return tasks_string

    def bigqueryinsertjoboperator_taskflow(self, task_id: str):
        """Generates Taskflow for BigQueryInsertJobOperator."""
        return f"""
    # -------------------------------------------------
    # Default BigQueryInsertJobOperator Taskflow 
    # -------------------------------------------------
        
    task_{task_id} = BigQueryInsertJobOperator(
        task_id="bigquery_insert_job_{task_id}",
        configuration={{
            "query": {{
                "query": "SELECT 1",
                "useLegacySql": False,
            }}
        }},
        location="{self.region}",
    )
    """

    def dataprocsubmitjoboperator_taskflow(
        self,
        task_id: str,
    ):
        """Generates Taskflow for DataprocSubmitJobOperator."""
        return f"""
    # -------------------------------------------------
    # Default DataprocSubmitJobOperator Taskflow 
    # -------------------------------------------------

    cluster_name = "composer-workload-simulator".replace("_", "-")

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
        task_id="hive_task_{task_id}",
        job={{
            "reference": {{"project_id": '{self.project_id}'}},
            "placement": {{"cluster_name": cluster_name}},
            "hive_job": {{"query_list": {{"queries": ["SHOW DATABASES;"]}}}},
        }},
        region='{self.region}',
        project_id='{self.project_id}',
    )
    create_cluster_{task_id} >> task_{task_id}
    """

    def beamrunjavapipelineoperator_taskflow(self, task_id: str):
        """Generates Taskflow for BeamRunJavaPipelineOperator."""
        return f"""
    # -------------------------------------------------
    # Default BeamRunJavaPipelineOperator Taskflow 
    # -------------------------------------------------

    bucket = "composer-workload-simulator".replace('_','-')
    public_bucket = "airflow-system-tests-resources"
    jar_file_name = "word-count-beam-bundled-0.1.jar"
    gcs_output = f"gs://{{bucket}}"
    gcs_jar = f"gs://{{public_bucket}}/dataflow/java/{{jar_file_name}}"

    create_bucket_{task_id} = GCSCreateBucketOperator(
        task_id="create_bucket_{task_id}", bucket_name=bucket
    )

    task_{task_id} = BeamRunJavaPipelineOperator(
        task_id="start_java_job-{task_id}",
        runner=BeamRunnerType.DataflowRunner,
        jar=gcs_jar,
        pipeline_options={{"output": gcs_output}},
        job_class="org.apache.beam.examples.WordCount",
        dataflow_config={{
            "job_name": "start-native-java-{task_id}",
            "location": '{self.region}',
        }},
        deferrable=False
    )

    delete_bucket_{task_id} = GCSDeleteBucketOperator(
        task_id="delete_bucket_{task_id}",
        bucket_name=bucket,
        trigger_rule="all_done"
    )
    create_bucket_{task_id} >> task_{task_id} >> delete_bucket_{task_id}
    """

    def dataprocbatchoperator_taskflow(
        self,
        task_id: str,
    ):
        """Generates Taskflow for DataprocCreateBatchOperator."""
        return f"""
    # -------------------------------------------------
    # Default DataprocBatchOperator Taskflow 
    # -------------------------------------------------    
    
    batch_id = "{self.dag_id}-{task_id}-batch".replace("_", "-")
    batch_config = {{
        "spark_batch": {{
            "jar_file_uris": ["file:///usr/lib/spark/examples/jars/spark-examples.jar"],
            "main_class": "org.apache.spark.examples.SparkPi",
        }}
    }}
    task_{task_id} = DataprocCreateBatchOperator(
        task_id="create_batch_{task_id}",
        project_id='{self.project_id}',
        region='{self.region}',
        batch_id=batch_id,
        batch=batch_config,
    )
    
    """

    def gcstogcsoperator_taskflow(self, task_id: str):
        """Generates Taskflow for GCSToGCSOperator."""
        return f"""
    # -------------------------------------------------
    # Default GCSToGCSOperator Taskflow
    # -------------------------------------------------   

    source_bucket="cloud-samples-data",
    destination_bucket = "composer-workload-simulator".replace('_','-')

    source_object = "bigquery/us-states/us-states.csv"

    create_destination_bucket_{task_id} = GCSCreateBucketOperator(
        task_id="create_destination_bucket_{task_id}",
        bucket_name=destination_bucket,
    )

    task_{task_id} = GCSToGCSOperator(
        task_id="gcs_to_gcs_{task_id}",
        source_bucket=source_bucket,
        source_object=source_object,
        destination_bucket=destination_bucket,
        destination_object="backup_" + source_object,
        move_object=False,
    )

    delete_destination_bucket_{task_id} = GCSDeleteBucketOperator(
        task_id="delete_destination_bucket_{task_id}",
        bucket_name=destination_bucket,
        trigger_rule="all_done",
    )

    create_destination_bucket_{task_id} >> task_{task_id} >> delete_destination_bucket_{task_id}
    """

    def gcstobigqueryoperator_taskflow(self, task_id: str):
        """Generates Taskflow for GCSToBigQueryOperator."""
        return f"""
    # -------------------------------------------------
    # Default GCSToBigQueryOperator Taskflow
    # -------------------------------------------------           

    source_bucket="cloud-samples-data",
    source_objects=["bigquery/us-states/us-states.csv"],
    dataset_name = "{self.dag_id}_{task_id}"
    
    create_dataset_{task_id} = BigQueryCreateEmptyDatasetOperator(
        task_id="create_dataset_{task_id}",
        dataset_id=dataset_name,
        location='{self.region}',
    )

    task_{task_id} = GCSToBigQueryOperator(
        task_id="gcs_to_bigquery_{task_id}",
        bucket=source_bucket,
        source_objects=source_objects,
        destination_project_dataset_table=f"{self.project_id}.{{dataset_name}}.test",
        source_format="CSV",
    )

    delete_dataset_{task_id} = BigQueryDeleteDatasetOperator(
        task_id="delete_dataset_{task_id}",
        dataset_id=dataset_name,
        delete_contents=True,
        trigger_rule="all_done",
    )

    create_dataset_{task_id} >> task_{task_id} >> delete_dataset_{task_id}
    """

    def gkestartpodoperator_taskflow(
        self,
        task_id: str,
    ):
        """Generates Taskflow for GKEStartPodOperator."""
        return f"""
    # -------------------------------------------------
    # Default GKEStartPodOperator Taskflow
    # -------------------------------------------------  

    cluster_name = "gkecluster-composer-workload-simulator".replace("_", "-")

    create_gke_cluster_{task_id} = GKECreateClusterOperator(
        task_id="create_gke_cluster_{task_id}",
        project_id="{self.project_id}", 
        location="{self.region}-a",
        body={{"name": cluster_name, "initial_node_count": 1}}
    )
    task_{task_id} = GKEStartPodOperator(
        task_id="gke_start_pod_task_{task_id}",
        project_id="{self.project_id}", 
        location="{self.region}-a",
        cluster_name=cluster_name,
        namespace="default",
        image="perl",
        name="test-pod",
        in_cluster=False,
        on_finish_action="delete_pod",
    )
    delete_gke_cluster_{task_id} = GKEDeleteClusterOperator(
        task_id="delete_gke_cluster_{task_id}",
        name=cluster_name,
        project_id="{self.project_id}", 
        location="{self.region}-a",
    )

    create_gke_cluster_{task_id} >> task_{task_id} >> delete_gke_cluster_{task_id}
    """

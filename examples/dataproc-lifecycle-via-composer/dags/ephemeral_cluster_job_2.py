# Copyright 2022 Google LLC
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

from __future__ import print_function
import datetime
from google.cloud import dataproc_v1
from airflow import models
from airflow.models.variable import Variable
from airflow.operators.python import PythonOperator
from airflow.operators.python import BranchPythonOperator
from airflow.providers.google.cloud.operators.dataproc import (
    DataprocCreateClusterOperator,
    DataprocSubmitJobOperator,
    ClusterGenerator
)

# -----------------------------------------------------------------
# Task functions
# -----------------------------------------------------------------

def check_cluster_status():
    cluster_name='ephemeral-cluster-test'
    print("cluster_name:"+ cluster_name +"  project:"+Variable.get('project')+"  region:"+Variable.get('region'))
    clusters = list_clusters()
    return (cluster_name in clusters and clusters[cluster_name]=="RUNNING")

def list_clusters():
    clusters = {}
    if Variable.get('region') == "global":
        # Use the default gRPC global endpoints.
        dataproc_cluster_client = dataproc_v1.ClusterControllerClient()
    else:
        # Use a regional gRPC endpoint. See:
        # https://cloud.google.com/dataproc/docs/concepts/regional-endpoints
        dataproc_cluster_client = dataproc_v1.ClusterControllerClient(
            client_options={"api_endpoint": f"{Variable.get('region')}-dataproc.googleapis.com:443"}
        )
    print("clusters list:")
    for cluster in dataproc_cluster_client.list_clusters(
        request={"project_id": Variable.get('project'), "region": Variable.get('region')}
    ):
        print(("{} - {}".format(cluster.cluster_name, cluster.status.state.name)))
        clusters[cluster.cluster_name] = cluster.status.state.name
    return clusters


def branch_task(**kwargs):
    if (kwargs['ti'].xcom_pull(task_ids='check_cluster_status')):
        return 'run_job'
    else:
        return 'create_cluster'

# -----------------------------------------------------------------
# Default configurations
# -----------------------------------------------------------------

default_dag_args = {
    'start_date': datetime.datetime(2022, 9, 13),
}

CLUSTER_GENERATOR_CONFIG = ClusterGenerator(
    project_id=Variable.get('project'),
    master_machine_type='n1-standard-4',
    worker_machine_type='n1-standard-4',
    num_workers=2,
    subnetwork_uri=Variable.get('subnetwork'),
    internal_ip_only=True,
    autoscaling_policy='projects/' + Variable.get('project') + '/locations/' + Variable.get('region') + '/autoscalingPolicies/' + Variable.get('autoscaling_policy'),
    idle_delete_ttl=300,
    service_account=Variable.get('dataproc_service_account')
).make()

PYSPARK_JOB = {
    "reference": {"project_id": Variable.get('project')},
    "placement": {"cluster_name": 'ephemeral-cluster-test'},
    "pyspark_job": {"main_python_file_uri": f"gs://{Variable.get('jobs_bucket')}/jobs/{'hello_world_spark.py'}"},
}

# -----------------------------------------------------------------
# Define a DAG of tasks.
# -----------------------------------------------------------------

# Any task you create within the context manager is automatically added to the DAG object.
with models.DAG(
        'ephemeral_cluster_job_2',
        catchup=False,
        schedule_interval='@daily',
        default_args=default_dag_args) as dag:

    check_cluster_status = PythonOperator(
        task_id="check_cluster_status",
        provide_context=True,
        python_callable=check_cluster_status,
        retries=0
    )
    branch_task = BranchPythonOperator(
        task_id="branch_task",
        provide_context=True,
        python_callable=branch_task,
        retries=0
    )
    run_job = DataprocSubmitJobOperator(
        task_id="run_job",
        job=PYSPARK_JOB,
        region=Variable.get('region'),
        project_id=Variable.get('project'),
        retries=0
    )
    run_job_im = DataprocSubmitJobOperator(
        task_id="run_job_im",
        job=PYSPARK_JOB,
        region=Variable.get('region'),
        project_id=Variable.get('project'),
        retries=0
    )
    create_cluster = DataprocCreateClusterOperator(
        task_id="create_cluster",
        project_id=Variable.get('project'),
        cluster_config=CLUSTER_GENERATOR_CONFIG,
        region=Variable.get('region'),
        cluster_name='ephemeral-cluster-test',
        retries=0
    )

    check_cluster_status >> branch_task >> run_job
    check_cluster_status >> branch_task >> create_cluster >> run_job_im
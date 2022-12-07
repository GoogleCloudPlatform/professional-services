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

# --------------------------------------------------------------------------------
# Load The Dependencies
# --------------------------------------------------------------------------------

import csv
import datetime
import io
import json
import logging
import os

from airflow import models
from airflow.providers.google.cloud.operators.dataflow import DataflowTemplatedJobStartOperator
from airflow.operators import dummy
from airflow.providers.google.cloud.operators.bigquery import  BigQueryDeleteTableOperator
from airflow.utils.task_group import TaskGroup

# --------------------------------------------------------------------------------
# Set variables - Needed for the DEMO
# --------------------------------------------------------------------------------
BQ_LOCATION = os.environ.get("BQ_LOCATION")
DATA_CAT_TAGS = json.loads(os.environ.get("DATA_CAT_TAGS"))
DWH_LAND_PRJ = os.environ.get("DWH_LAND_PRJ")
DWH_LAND_BQ_DATASET = os.environ.get("DWH_LAND_BQ_DATASET")
DWH_LAND_GCS = os.environ.get("DWH_LAND_GCS")
DWH_CURATED_PRJ = os.environ.get("DWH_CURATED_PRJ")
DWH_CURATED_BQ_DATASET = os.environ.get("DWH_CURATED_BQ_DATASET")
DWH_CURATED_GCS = os.environ.get("DWH_CURATED_GCS")
DWH_CONFIDENTIAL_PRJ = os.environ.get("DWH_CONFIDENTIAL_PRJ")
DWH_CONFIDENTIAL_BQ_DATASET = os.environ.get("DWH_CONFIDENTIAL_BQ_DATASET")
DWH_CONFIDENTIAL_GCS = os.environ.get("DWH_CONFIDENTIAL_GCS")
DWH_PLG_PRJ = os.environ.get("DWH_PLG_PRJ")
DWH_PLG_BQ_DATASET = os.environ.get("DWH_PLG_BQ_DATASET")
DWH_PLG_GCS = os.environ.get("DWH_PLG_GCS")
GCP_REGION = os.environ.get("GCP_REGION")
DRP_PRJ = os.environ.get("DRP_PRJ")
DRP_BQ = os.environ.get("DRP_BQ")
DRP_GCS = os.environ.get("DRP_GCS")
DRP_PS = os.environ.get("DRP_PS")
LOD_PRJ = os.environ.get("LOD_PRJ")
LOD_GCS_STAGING = os.environ.get("LOD_GCS_STAGING")
LOD_NET_VPC = os.environ.get("LOD_NET_VPC")
LOD_NET_SUBNET = os.environ.get("LOD_NET_SUBNET")
LOD_SA_DF = os.environ.get("LOD_SA_DF")
ORC_PRJ = os.environ.get("ORC_PRJ")
ORC_GCS = os.environ.get("ORC_GCS")
TRF_PRJ = os.environ.get("TRF_PRJ")
TRF_GCS_STAGING = os.environ.get("TRF_GCS_STAGING")
TRF_NET_VPC = os.environ.get("TRF_NET_VPC")
TRF_NET_SUBNET = os.environ.get("TRF_NET_SUBNET")
TRF_SA_DF = os.environ.get("TRF_SA_DF")
TRF_SA_BQ = os.environ.get("TRF_SA_BQ")
DF_KMS_KEY = os.environ.get("DF_KMS_KEY", "")
DF_REGION = os.environ.get("GCP_REGION")
DF_ZONE = os.environ.get("GCP_REGION") + "-b"

# --------------------------------------------------------------------------------
# Set default arguments
# --------------------------------------------------------------------------------

# If you are running Airflow in more than one time zone
# see https://airflow.apache.org/docs/apache-airflow/stable/timezone.html
# for best practices
yesterday = datetime.datetime.now() - datetime.timedelta(days=1)

default_args = {
  'owner': 'airflow',
  'start_date': yesterday,
  'depends_on_past': False,
  'email': [''],
  'email_on_failure': False,
  'email_on_retry': False,
  'retries': 1,
  'retry_delay': datetime.timedelta(minutes=5),
  'dataflow_default_options': {
    'location': DF_REGION,
    'zone': DF_ZONE,
    'stagingLocation': LOD_GCS_STAGING,
    'tempLocation': LOD_GCS_STAGING + "/tmp",
    'serviceAccountEmail': LOD_SA_DF,
    'subnetwork': LOD_NET_SUBNET,
    'ipConfiguration': "WORKER_IP_PRIVATE",
    'kmsKeyName' : DF_KMS_KEY
  },
}

# --------------------------------------------------------------------------------
# Main DAG
# --------------------------------------------------------------------------------

with models.DAG(
    'delete_tables_dag',
    default_args=default_args,
    schedule_interval=None) as dag:
  start = dummy.DummyOperator(
    task_id='start',
    trigger_rule='all_success'
  )

  end = dummy.DummyOperator(
    task_id='end',
    trigger_rule='all_success'
  )

  # Bigquery Tables deleted here for demo porpuse. 
  # Consider a dedicated pipeline or tool for a real life scenario.
  with TaskGroup('delete_table') as delte_table:  
    delete_table_customers = BigQueryDeleteTableOperator(
      task_id="delete_table_customers",
      deletion_dataset_table=DWH_LAND_PRJ+"."+DWH_LAND_BQ_DATASET+".customers",
      impersonation_chain=[TRF_SA_DF]
    )  

    delete_table_purchases = BigQueryDeleteTableOperator(
      task_id="delete_table_purchases",
      deletion_dataset_table=DWH_LAND_PRJ+"."+DWH_LAND_BQ_DATASET+".purchases",
      impersonation_chain=[TRF_SA_DF]
    )   

    delete_table_customer_purchase_curated = BigQueryDeleteTableOperator(
      task_id="delete_table_customer_purchase_curated",
      deletion_dataset_table=DWH_CURATED_PRJ+"."+DWH_CURATED_BQ_DATASET+".customer_purchase",
      impersonation_chain=[TRF_SA_DF]
    )   

    delete_table_customer_purchase_confidential = BigQueryDeleteTableOperator(
      task_id="delete_table_customer_purchase_confidential",
      deletion_dataset_table=DWH_CONFIDENTIAL_PRJ+"."+DWH_CONFIDENTIAL_BQ_DATASET+".customer_purchase",
      impersonation_chain=[TRF_SA_DF]
    )       

  start >> delte_table >> end  

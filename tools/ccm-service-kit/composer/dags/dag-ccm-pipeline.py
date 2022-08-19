# Copyright 2022 Google LLC All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from dependencies.scripts.run_sts import invoke_sts_job
from dependencies.scripts.variable_reader import getVariables
from dependencies.queries.ccm_queries import QueriesCCM
from dependencies.queries.schemas import Schema

from datetime import datetime, timedelta

from airflow.contrib.operators import bigquery_operator
from airflow.providers.google.cloud.transfers.gcs_to_gcs import GCSToGCSOperator
from airflow.providers.google.cloud.transfers.gcs_to_bigquery import GCSToBigQueryOperator
from airflow.operators.python import PythonOperator
from airflow import DAG


# The purpose of this DAG is to invoke an Storage transfer operator to access the information from Azure/AWS
# and store it in CS bucket for later use. 

# Use the getVariables.py script or load the json file into airflow and use airflow.model Variable.
#If you want to use the getVariables.py you have to replace the provided json file path with you own
# If you want to use the airflow variables, you have to call the variables like this: project_id = Variable.get("project_id")
# and import airflow.models.Variable

variables = getVariables()

azure_sts_id = variables["sts_id_azure"]
aws_sts_id = variables["sts_id_aws"]
project_id = variables["project_id"]
ccm_bucket = variables["ccm_bucket"]
dataset_staging = variables['ccm_staging_dataset']
azure_lz_folder = variables["prefix_azure_lz"]
azure_historical_folder = variables["prefix_hist_azure"]
aws_lz_folder = variables["prefix_aws_lz"]
aws_historical_folder = variables["prefix_hist_aws"]

# Configure the args
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email': ['airflow@example.com'],
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}

# Define DAG: Set ID and assign default args, tags and schedule variables.
with DAG(
    'dag-ccm-pipeline',
    default_args=default_args,
    description='A sample code of the CCM pipeline',
    schedule_interval=timedelta(days=1),
    start_date=datetime(2021, 1, 1),
    catchup=False,
    is_paused_upon_creation = True,
    tags=['ccm-pipeline'],
) as dag:

    ## First we need to get the files from each cloud provider

    ## If you want to get the file from Azure using API you have to replace this task and use the LoadFileFromAPI operator
    run_azure_sts = PythonOperator(
        task_id = "run_azure_sts",
        python_callable=invoke_sts_job,
        op_kwargs={"sts_id": azure_sts_id, "project":project_id }
    )

    ## If you want to get the file from AWS using API you have to replace this task and use the LoadFileFromAPI operator
    run_aws_sts = PythonOperator(
        task_id = "run_aws_sts",
        python_callable=invoke_sts_job,
        op_kwargs={"sts_id": aws_sts_id, "project":project_id }
    )


    ## we have to load the Azure billing from GCS to bq

    azure_raw_data_load = GCSToBigQueryOperator(
        task_id='azure_raw_data_load',
        bucket=ccm_bucket,
        source_objects=[azure_lz_folder+'/*.csv'],
        destination_project_dataset_table= project_id+"."+dataset_staging+".azure_billing",
        schema_fields= Schema.AZURE_BILLING,
        skip_leading_rows= 1,
        write_disposition='WRITE_TRUNCATE',
        dag=dag,
    )
    
    ## we have to load the aws billing from GCS to bq
    aws_raw_data_load = GCSToBigQueryOperator(
        task_id='aws_raw_data_load',
        bucket=ccm_bucket,
        source_objects=[aws_lz_folder + '/*.csv'],
        destination_project_dataset_table=project_id+"."+dataset_staging+".aws_billing",
        schema_fields= Schema.AWS_BILLING,
        skip_leading_rows= 1,
        write_disposition='WRITE_TRUNCATE',
        dag=dag,
    )


    # first of all we will clean the unified list to load the new data
    clean_unified_list = bigquery_operator.BigQueryOperator(
        task_id='clean_unified_list',
        sql= QueriesCCM.TRUNCATE_UNIFIED_LIST,
        use_legacy_sql=False,
    )
    # we load the data from the gcp billing table to the unified_list
    gcp_insert_to_unified_list = bigquery_operator.BigQueryOperator(
        task_id='gcp_insert_to_unified_list',
        sql= QueriesCCM.GCP_INSERT,
        use_legacy_sql=False,
    )

    azure_insert_to_unified_list = bigquery_operator.BigQueryOperator(
        task_id='azure_insert_to_unified_list',
        sql= QueriesCCM.AZURE_INSERT,
        use_legacy_sql=False,
    )

    aws_insert_to_unified_list = bigquery_operator.BigQueryOperator(
        task_id='aws_insert_to_unified_list',
        sql= QueriesCCM.AWS_INSERT,
        use_legacy_sql=False,
    )

    #### refreshing the dimentions based on the unified list

    dim_product_refresh = bigquery_operator.BigQueryOperator(
        task_id='dim_product_refresh',
        sql= QueriesCCM.REFRESH_PRODUCT,
        use_legacy_sql=False,
    )

    dim_resurce_location_refresh = bigquery_operator.BigQueryOperator(
        task_id='dim_resurce_location_refresh',
        sql= QueriesCCM.REFRESH_RESOURCE_LOCATION,
        use_legacy_sql=False,
    )

    dim_project_refresh = bigquery_operator.BigQueryOperator(
        task_id='dim_project_refresh',
        sql= QueriesCCM.REFESH_PROJECT,
        use_legacy_sql=False,
    )

    dim_currency_refresh = bigquery_operator.BigQueryOperator(
        task_id='dim_currency_refresh',
        sql= QueriesCCM.REFRESH_CURRENCY,
        use_legacy_sql=False,
    )

    dim_charge_refresh = bigquery_operator.BigQueryOperator(
        task_id='dim_charge_refresh',
        sql= QueriesCCM.REFRESH_CHARGE,
        use_legacy_sql=False,
    )

    dim_billing_account_refresh = bigquery_operator.BigQueryOperator(
        task_id='dim_billing_account_refresh',
        sql= QueriesCCM.REFRESH_BILLING_ACCOUNT,
        use_legacy_sql=False,
    )

    dim_charge_type_refresh = bigquery_operator.BigQueryOperator(
        task_id='dim_charge_type_refresh',
        sql= QueriesCCM.REFRESH_CHARGE_TYPE,
        use_legacy_sql=False,
    )

    dim_service_refresh = bigquery_operator.BigQueryOperator(
        task_id='dim_service_refresh',
        sql= QueriesCCM.REFRESH_SERVICE,
        use_legacy_sql=False,
    )

    dim_service_type_refresh = bigquery_operator.BigQueryOperator(
        task_id='dim_service_type_refresh',
        sql= QueriesCCM.REFRESH_SERVICE_TYPE,
        use_legacy_sql=False,
    )


    #### loading data into the fact table based on the unified list and dimentions

    fact_unified_cloud_billing_inserts = bigquery_operator.BigQueryOperator(
        task_id='fact_unified_cloud_billing_inserts',
        sql= QueriesCCM.REFRESH_UNIFIED_CLOUD_BILLING,
        use_legacy_sql=False,
    )

    # Move azure and aws processed file from the landing zone to the historical folder

    move_azure_file_to_historical = GCSToGCSOperator(
        task_id="move_azure_file_to_historical",
        source_bucket=ccm_bucket,
        source_objects=[azure_lz_folder+'/*'],
        destination_bucket=ccm_bucket,
        destination_object=azure_historical_folder+'/',
        move_object= True
    )

    move_aws_file_to_historical = GCSToGCSOperator(
        task_id="move_aws_file_to_historical",
        source_bucket=ccm_bucket,
        source_objects=[aws_lz_folder+'/*'],
        destination_bucket=ccm_bucket,
        destination_object=aws_historical_folder+'/', 
        move_object= True
    )



    # Define DAG's tasks order of execution 

    [run_azure_sts, run_aws_sts] >> azure_raw_data_load >> aws_raw_data_load >> clean_unified_list >> gcp_insert_to_unified_list >> azure_insert_to_unified_list >> aws_insert_to_unified_list
    aws_insert_to_unified_list >> dim_product_refresh >> dim_resurce_location_refresh >> dim_project_refresh >> dim_currency_refresh >> dim_charge_refresh
    dim_charge_refresh >> dim_billing_account_refresh >> dim_charge_type_refresh >> dim_service_refresh >> dim_service_type_refresh
    dim_service_type_refresh >> fact_unified_cloud_billing_inserts >> [move_azure_file_to_historical,move_aws_file_to_historical]
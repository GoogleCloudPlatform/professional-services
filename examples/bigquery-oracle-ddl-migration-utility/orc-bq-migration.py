# Copyright 2022 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
"""Module for BigQuery DDL Migration using Airflow Dag"""


from datetime import timedelta
import airflow
from airflow import DAG
from airflow.models import Variable
from airflow.decorators import task

project_id = Variable.get("project_id")
gcs_oracle_client_path = Variable.get("ddl_gcs_oracle_client_path")
gcs_config_path_cdc = Variable.get("ddl_gcs_config_path_cdc")
gcs_config_path_replica = Variable.get("ddl_gcs_config_path_replica")


default_args = {
    "start_date": airflow.utils.dates.days_ago(1),
    "retries": 0,
    'provide_context': True
}

with DAG(
    "Oracle_BQ_DDL_Migration",
    schedule_interval=None,
    default_args=default_args,
    catchup=False
) as dag:
        
       @task.virtualenv(
        task_id="oracle_ddl_extraction", requirements=["oracledb","google-cloud-storage","google-cloud-bigquery","google-cloud-secret-manager"],system_site_packages=True)

       def orc_ddl_extraction_task(gcs_config_path_replica,project_id,gcs_oracle_client_path):
   
            from google.cloud import bigquery
            from google.cloud import storage
            from google.cloud import secretmanager
            import oracledb
            import oracle_ddl_extraction

            oracle_ddl_extraction.main(gcs_config_path_replica,project_id,gcs_oracle_client_path)
    

       orc_ddl_extraction_task = orc_ddl_extraction_task(gcs_config_path_replica,project_id,gcs_oracle_client_path)


       @task.virtualenv(
        task_id="oracle_to_bq_conversion", requirements=["google-cloud-bigquery-migration==0.4.0","google-cloud-storage","google-cloud-bigquery"],system_site_packages=True
        )

       def orc_bq_conversion_task(gcs_config_path_cdc,project_id):
    
            from google.cloud import bigquery
            from google.cloud import bigquery_migration_v2
            from google.cloud import storage
            import oracle_bq_converter

            oracle_bq_converter.main(gcs_config_path_cdc,project_id)
    

       orc_bq_conversion_task = orc_bq_conversion_task(gcs_config_path_cdc,project_id)

       @task.virtualenv(
        task_id="cdc_table_creation", requirements=["google-cloud-storage","google-cloud-bigquery","google-api-core"],system_site_packages=True
        )

       def cdc_table_creation_task(gcs_config_path_cdc,project_id):
    
            from google.cloud import bigquery
            from google.cloud.exceptions import NotFound
            from google.cloud import storage
            import bq_table_creator

            bq_table_creator.main(gcs_config_path_cdc,project_id)
    

       cdc_table_creation_task = cdc_table_creation_task(gcs_config_path_cdc,project_id)


       @task.virtualenv(
        task_id="replica_table_creation", requirements=["google-cloud-storage","google-cloud-bigquery","google-api-core"],system_site_packages=True
        )

       def replica_table_creation_task(gcs_config_path_replica,project_id):
    
            from google.cloud import bigquery
            from google.cloud.exceptions import NotFound
            from google.cloud import storage
            import bq_table_creator

            bq_table_creator.main(gcs_config_path_replica,project_id)
    

       replica_table_creation_task = replica_table_creation_task(gcs_config_path_replica,project_id)

       @task.virtualenv(
        task_id="archive_ddl", requirements=["google-cloud-storage"],system_site_packages=True
        )

       def archive_ddl_task(gcs_config_path_replica,project_id):
    
            from google.cloud import storage
            import archive_ddl

            archive_ddl.main(gcs_config_path_replica,project_id)
    

       archive_ddl_task = archive_ddl_task(gcs_config_path_replica,project_id)

       orc_ddl_extraction_task >> orc_bq_conversion_task >> cdc_table_creation_task >> replica_table_creation_task  >> archive_ddl_task

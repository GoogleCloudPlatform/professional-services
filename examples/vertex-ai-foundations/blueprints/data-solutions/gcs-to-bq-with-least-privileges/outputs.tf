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

output "bq_tables" {
  description = "Bigquery Tables."
  value       = module.bigquery-dataset.table_ids
}

output "buckets" {
  description = "GCS bucket Cloud KMS crypto keys."
  value = {
    data   = module.gcs-data.name
    df-tmp = module.gcs-df-tmp.name
  }
}

output "project_id" {
  description = "Project id."
  value       = module.project.project_id
}

output "service_accounts" {
  description = "Service account."
  value = {
    bq      = module.service-account-bq.email
    df      = module.service-account-df.email
    orch    = module.service-account-orch.email
    landing = module.service-account-landing.email
  }
}

output "command_01_gcs" {
  description = "gcloud command to copy data into the created bucket impersonating the service account."
  value       = "gsutil -i ${module.service-account-landing.email} cp data-demo/* ${module.gcs-data.url}"
}

output "command_02_dataflow" {
  description = "Command to run Dataflow template impersonating the service account."
  value = templatefile("${path.module}/templates/dataflow.tftpl", {
    sa_orch_email    = module.service-account-orch.email
    project_id       = module.project.project_id
    region           = var.region
    subnet           = local.network_subnet_selflink
    gcs_df_stg       = format("%s/%s", module.gcs-df-tmp.url, "stg")
    sa_df_email      = module.service-account-df.email
    cmek_encryption  = var.cmek_encryption
    kms_key_df       = var.cmek_encryption ? module.kms[0].key_ids.key-df : null
    gcs_data         = module.gcs-data.url
    data_schema_file = format("%s/%s", module.gcs-data.url, "person_schema.json")
    data_udf_file    = format("%s/%s", module.gcs-data.url, "person_udf.js")
    data_file        = format("%s/%s", module.gcs-data.url, "person.csv")
    bigquery_dataset = module.bigquery-dataset.dataset_id
    bigquery_table   = module.bigquery-dataset.tables["person"].table_id
    gcs_df_tmp       = format("%s/%s", module.gcs-df-tmp.url, "tmp")
  })
}

output "command_03_bq" {
  description = "BigQuery command to query imported data."
  value = templatefile("${path.module}/templates/bigquery.tftpl", {
    project_id       = module.project.project_id
    bigquery_dataset = module.bigquery-dataset.dataset_id
    bigquery_table   = module.bigquery-dataset.tables["person"].table_id
    sql_limit        = 1000
  })
}

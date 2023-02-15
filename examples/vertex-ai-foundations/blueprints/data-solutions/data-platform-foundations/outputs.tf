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

# tfdoc:file:description Output variables.

output "bigquery-datasets" {
  description = "BigQuery datasets."
  value = {
    drop-bq-0             = module.drop-bq-0.dataset_id,
    dwh-landing-bq-0      = module.dwh-lnd-bq-0.dataset_id,
    dwh-curated-bq-0      = module.dwh-cur-bq-0.dataset_id,
    dwh-confidential-bq-0 = module.dwh-conf-bq-0.dataset_id,
    dwh-plg-bq-0          = module.dwh-plg-bq-0.dataset_id,
  }
}

output "gcs-buckets" {
  description = "GCS buckets."
  value = {
    dwh-landing-cs-0      = module.dwh-lnd-cs-0.name,
    dwh-curated-cs-0      = module.dwh-cur-cs-0.name,
    dwh-confidential-cs-0 = module.dwh-conf-cs-0.name,
    dwh-plg-cs-0          = module.dwh-plg-cs-0.name,
    drop-cs-0             = module.drop-cs-0.name,
    lod-cs-df             = module.load-cs-df-0.name,
    orch-cs-0             = module.orch-cs-0.name,
    transf-cs-df          = module.transf-cs-df-0.name,
  }
}

output "kms_keys" {
  description = "Cloud MKS keys."
  value       = local.service_encryption_keys
}

output "projects" {
  description = "GCP Projects informations."
  value = {
    project_number = {
      dwh-landing      = module.dwh-lnd-project.number,
      dwh-curated      = module.dwh-cur-project.number,
      dwh-confidential = module.dwh-conf-project.number,
      dwh-plg          = module.dwh-plg-project.number,
      exposure         = module.exp-project.number,
      dropoff          = module.drop-project.number,
      load             = module.load-project.number,
      orchestration    = module.orch-project.number,
      transformation   = module.transf-project.number,
    }
    project_id = {
      dwh-landing      = module.dwh-lnd-project.project_id,
      dwh-curated      = module.dwh-cur-project.project_id,
      dwh-confidential = module.dwh-conf-project.project_id,
      dwh-plg          = module.dwh-plg-project.project_id,
      exposure         = module.exp-project.project_id,
      dropoff          = module.drop-project.project_id,
      load             = module.load-project.project_id,
      orchestration    = module.orch-project.project_id,
      transformation   = module.transf-project.project_id,
    }
  }
}

output "vpc_network" {
  description = "VPC network."
  value = {
    load           = local.load_vpc
    orchestration  = local.orch_vpc
    transformation = local.transf_vpc
  }
}

output "vpc_subnet" {
  description = "VPC subnetworks."
  value = {
    load           = local.load_subnet
    orchestration  = local.orch_subnet
    transformation = local.transf_subnet
  }
}

output "demo_commands" {
  description = "Demo commands."
  value = {
    01 = "gsutil -i ${module.drop-sa-cs-0.email} cp demo/data/*.csv gs://${module.drop-cs-0.name}"
    02 = "gsutil -i ${module.orch-sa-cmp-0.email} cp demo/data/*.j* gs://${module.orch-cs-0.name}"
    03 = "gsutil -i ${module.orch-sa-cmp-0.email} cp demo/*.py ${google_composer_environment.orch-cmp-0.config[0].dag_gcs_prefix}/"
    04 = "Open ${google_composer_environment.orch-cmp-0.config.0.airflow_uri} and run uploaded DAG."
    05 = <<EOT
           bq query --project_id=${module.dwh-conf-project.project_id} --use_legacy_sql=false 'SELECT * EXCEPT (name, surname) FROM `${module.dwh-conf-project.project_id}.${module.dwh-conf-bq-0.dataset_id}.customer_purchase` LIMIT 1000'"
         EOT
  }
}

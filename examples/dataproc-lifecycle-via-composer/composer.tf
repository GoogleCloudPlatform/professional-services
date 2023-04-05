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

resource "google_composer_environment" "composer_environment" {
  name = var.composer_env_name
  project = var.project_id
  region  = var.region
  depends_on = [null_resource.dags_generator_execution]
  config {
    node_config {
      service_account = module.service-account.name
      network =  local.use_shared_vpc ? "${replace(var.network_config.network_self_link,"https://www.googleapis.com/compute/v1/","")}" : "${replace(local.vpc_self_link,"https://www.googleapis.com/compute/v1/","")}"
      subnetwork =  local.use_shared_vpc ? "${replace(var.network_config.subnet_self_link,"https://www.googleapis.com/compute/v1/","")}" : "${replace(local.subnet,"https://www.googleapis.com/compute/v1/","")}"

      dynamic "ip_allocation_policy" {
        for_each = local.use_shared_vpc ? {"var"="1"}:{}
        content {
          cluster_secondary_range_name = try(var.network_config.composer_secondary_ranges.pods, "pods")
          services_secondary_range_name = try(var.network_config.composer_secondary_ranges.services, "services")
        }
      }
    }

    private_environment_config {
      enable_private_endpoint = true
      cloud_composer_connection_subnetwork = local.use_shared_vpc ? "${replace(var.network_config.subnet_self_link,"https://www.googleapis.com/compute/v1/","")}" : "${replace(local.subnet,"https://www.googleapis.com/compute/v1/","")}"
      enable_privately_used_public_ips = false
    }
    software_config {
      image_version = "composer-2-airflow-2"
      env_variables = {
        "AIRFLOW_VAR_CLUSTER_NAME": "${var.dataproc_config.dataproc_cluster_name}",
        "AIRFLOW_VAR_PROJECT": "${var.project_id}",
        "AIRFLOW_VAR_REGION": "${var.region}",
        "AIRFLOW_VAR_JOBS_BUCKET": module.gcs.name,
        "AIRFLOW_VAR_AUTOSCALING_POLICY": "${var.dataproc_config.autoscaling_policy_id}",
        "AIRFLOW_VAR_SUBNETWORK": local.use_shared_vpc ? "${var.network_config.subnet_self_link}" : "${local.subnet}",
        "AIRFLOW_VAR_DATAPROC_SERVICE_ACCOUNT": "${module.dataproc-service-account.email}"
      }
    }
  }
}

resource "google_storage_bucket_object" "dataproc_lifecycle_dags" {
  for_each = fileset(path.module, "dags/*")
  name   = each.value
  source = each.value
  bucket = "${replace(replace(google_composer_environment.composer_environment.config[0].dag_gcs_prefix,"gs://",""),"/dags","")}"
  depends_on = [google_composer_environment.composer_environment]
}

resource "null_resource" "dags_generator_execution" {
    provisioner "local-exec" {
      working_dir = "include"
      command = "python3 generate_dag_files.py"
    }
}
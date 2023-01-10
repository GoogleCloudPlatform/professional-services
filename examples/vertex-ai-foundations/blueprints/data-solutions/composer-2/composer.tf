/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module "comp-sa" {
  source       = "../../../modules/iam-service-account"
  project_id   = module.project.project_id
  prefix       = var.prefix
  name         = "cmp"
  display_name = "Composer service account"
}

resource "google_composer_environment" "env" {
  name    = "${var.prefix}-composer"
  project = module.project.project_id
  region  = var.region
  config {
    dynamic "software_config" {
      for_each = (
        try(var.composer_config.software_config, null) != null
        ? { 1 = 1 }
        : {}
      )
      content {
        airflow_config_overrides = try(var.composer_config.software_config.airflow_config_overrides, null)
        pypi_packages            = try(var.composer_config.software_config.pypi_packages, null)
        env_variables            = try(var.composer_config.software_config.env_variables, null)
        image_version            = try(var.composer_config.software_config.image_version, null)
        python_version           = try(var.composer_config.software_config.python_version, null)
        scheduler_count          = try(var.composer_config.software_config.scheduler_count, null)
      }
    }
    dynamic "workloads_config" {
      for_each = (try(var.composer_config.workloads_config, null) != null ? { 1 = 1 } : {})

      content {
        scheduler {
          cpu        = try(var.composer_config.workloads_config.scheduler.cpu, null)
          memory_gb  = try(var.composer_config.workloads_config.scheduler.memory_gb, null)
          storage_gb = try(var.composer_config.workloads_config.scheduler.storage_gb, null)
          count      = try(var.composer_config.workloads_config.scheduler.count, null)
        }
        web_server {
          cpu        = try(var.composer_config.workloads_config.web_server.cpu, null)
          memory_gb  = try(var.composer_config.workloads_config.web_server.memory_gb, null)
          storage_gb = try(var.composer_config.workloads_config.web_server.storage_gb, null)
        }
        worker {
          cpu        = try(var.composer_config.workloads_config.worker.cpu, null)
          memory_gb  = try(var.composer_config.workloads_config.worker.memory_gb, null)
          storage_gb = try(var.composer_config.workloads_config.worker.storage_gb, null)
          min_count  = try(var.composer_config.workloads_config.worker.min_count, null)
          max_count  = try(var.composer_config.workloads_config.worker.max_count, null)
        }
      }
    }

    environment_size = var.composer_config.environment_size

    node_config {
      network              = local.orch_vpc
      subnetwork           = local.orch_subnet
      service_account      = module.comp-sa.email
      enable_ip_masq_agent = "true"
      tags                 = ["composer-worker"]
      ip_allocation_policy {
        cluster_secondary_range_name = try(
          var.network_config.composer_secondary_ranges.pods, "pods"
        )
        services_secondary_range_name = try(
          var.network_config.composer_secondary_ranges.services, "services"
        )
      }
    }
    private_environment_config {
      enable_private_endpoint = "true"
      cloud_sql_ipv4_cidr_block = try(
        var.network_config.composer_ip_ranges.cloudsql, "10.20.10.0/24"
      )
      master_ipv4_cidr_block = try(
        var.network_config.composer_ip_ranges.gke_master, "10.20.11.0/28"
      )
    }
    dynamic "encryption_config" {
      for_each = (
        try(var.service_encryption_keys[var.region], null) != null
        ? { 1 = 1 }
        : {}
      )
      content {
        kms_key_name = try(var.service_encryption_keys[var.region], null)
      }
    }
  }
  depends_on = [
    google_project_iam_member.shared_vpc,
    module.project
  ]
}

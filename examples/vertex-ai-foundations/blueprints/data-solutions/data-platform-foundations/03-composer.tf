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

# tfdoc:file:description Orchestration Cloud Composer definition.

module "orch-sa-cmp-0" {
  source       = "../../../modules/iam-service-account"
  project_id   = module.orch-project.project_id
  prefix       = var.prefix
  name         = "orc-cmp-0"
  display_name = "Data platform Composer service account"
  iam = {
    "roles/iam.serviceAccountTokenCreator" = [local.groups_iam.data-engineers]
    "roles/iam.serviceAccountUser"         = [module.orch-sa-cmp-0.iam_email]
  }
}

resource "google_composer_environment" "orch-cmp-0" {
  provider = google-beta
  project  = module.orch-project.project_id
  name     = "${var.prefix}-orc-cmp-0"
  region   = var.region
  config {
    node_count = var.composer_config.node_count
    node_config {
      zone                 = "${var.region}-b"
      service_account      = module.orch-sa-cmp-0.email
      network              = local.orch_vpc
      subnetwork           = local.orch_subnet
      tags                 = ["composer-worker", "http-server", "https-server"]
      enable_ip_masq_agent = true
      ip_allocation_policy {
        use_ip_aliases = "true"
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
      web_server_ipv4_cidr_block = try(
        var.network_config.composer_ip_ranges.web_server, "10.20.11.16/28"
      )
    }
    software_config {
      image_version = var.composer_config.airflow_version
      env_variables = merge(
        var.composer_config.env_variables, {
          BQ_LOCATION                 = var.location
          DATA_CAT_TAGS               = try(jsonencode(module.common-datacatalog.tags), "{}")
          DF_KMS_KEY                  = try(var.service_encryption_keys.dataflow, "")
          DRP_PRJ                     = module.drop-project.project_id
          DRP_BQ                      = module.drop-bq-0.dataset_id
          DRP_GCS                     = module.drop-cs-0.url
          DRP_PS                      = module.drop-ps-0.id
          DWH_LAND_PRJ                = module.dwh-lnd-project.project_id
          DWH_LAND_BQ_DATASET         = module.dwh-lnd-bq-0.dataset_id
          DWH_LAND_GCS                = module.dwh-lnd-cs-0.url
          DWH_CURATED_PRJ             = module.dwh-cur-project.project_id
          DWH_CURATED_BQ_DATASET      = module.dwh-cur-bq-0.dataset_id
          DWH_CURATED_GCS             = module.dwh-cur-cs-0.url
          DWH_CONFIDENTIAL_PRJ        = module.dwh-conf-project.project_id
          DWH_CONFIDENTIAL_BQ_DATASET = module.dwh-conf-bq-0.dataset_id
          DWH_CONFIDENTIAL_GCS        = module.dwh-conf-cs-0.url
          DWH_PLG_PRJ                 = module.dwh-plg-project.project_id
          DWH_PLG_BQ_DATASET          = module.dwh-plg-bq-0.dataset_id
          DWH_PLG_GCS                 = module.dwh-plg-cs-0.url
          GCP_REGION                  = var.region
          LOD_PRJ                     = module.load-project.project_id
          LOD_GCS_STAGING             = module.load-cs-df-0.url
          LOD_NET_VPC                 = local.load_vpc
          LOD_NET_SUBNET              = local.load_subnet
          LOD_SA_DF                   = module.load-sa-df-0.email
          ORC_PRJ                     = module.orch-project.project_id
          ORC_GCS                     = module.orch-cs-0.url
          TRF_PRJ                     = module.transf-project.project_id
          TRF_GCS_STAGING             = module.transf-cs-df-0.url
          TRF_NET_VPC                 = local.transf_vpc
          TRF_NET_SUBNET              = local.transf_subnet
          TRF_SA_DF                   = module.transf-sa-df-0.email
          TRF_SA_BQ                   = module.transf-sa-bq-0.email
        }
      )
    }

    dynamic "encryption_config" {
      for_each = (
        try(local.service_encryption_keys.composer != null, false)
        ? { 1 = 1 }
        : {}
      )
      content {
        kms_key_name = try(local.service_encryption_keys.composer, null)
      }
    }

    # dynamic "web_server_network_access_control" {
    #   for_each = toset(
    #     var.network_config.web_server_network_access_control == null
    #     ? []
    #     : [var.network_config.web_server_network_access_control]
    #   )
    #   content {
    #     dynamic "allowed_ip_range" {
    #       for_each = toset(web_server_network_access_control.key)
    #       content {
    #         value = allowed_ip_range.key
    #       }
    #     }
    #   }
    # }

  }
  depends_on = [
    google_project_iam_member.shared_vpc,
  ]
}

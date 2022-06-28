
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

locals {
  gke_agent_sa      = "service-${data.google_project.project.number}@container-engine-robot.iam.gserviceaccount.com"
  cloud_services_sa = "${data.google_project.project.number}@cloudservices.gserviceaccount.com"
  composer_agent_sa = "service-${data.google_project.project.number}@cloudcomposer-accounts.iam.gserviceaccount.com"
  composer_worker_sa_email = (
    var.composer_service_account_create
    ? (
      length(google_service_account.composer_worker_sa) > 0
      ? google_service_account.composer_worker_sa[0].email
      : null
    )
    : var.composer_service_account
  )
  subnet_primary_cidr_range    = data.google_compute_subnetwork.subnetwork.ip_cidr_range
  subnet_pod_cidr_range        = [for secondary_range in data.google_compute_subnetwork.subnetwork.secondary_ip_range : secondary_range.ip_cidr_range if secondary_range.range_name == var.pod_ip_allocation_range_name][0]
  subnet_svc_cidr_range        = [for secondary_range in data.google_compute_subnetwork.subnetwork.secondary_ip_range : secondary_range.ip_cidr_range if secondary_range.range_name == var.service_ip_allocation_range_name][0]
  gke_agents_permissions       = ["roles/compute.networkUser", "roles/compute.securityAdmin", "roles/container.hostServiceAgentUser"]
  composer_agents_permissions  = ["roles/compute.networkUser", "roles/composer.sharedVpcAgent"]
  cloudservices_sa_permissions = ["roles/compute.networkUser"]
}

data "google_compute_subnetwork" "subnetwork" {
  name    = var.subnetwork
  project = var.network_project_id
  region  = var.subnetwork_region
}


module "composer-v2-private" {
  #TODO Fix source when v3.2.0 is released
  source                           = "github.com/majduk/terraform-google-composer.git?ref=20efd9da606af3f57343420eb0888139157f9d05/modules/create_environment_v2"
  #version                          = "~>3.2.0"
  project_id                       = var.project_id
  composer_env_name                = var.composer_env_name
  region                           = var.region
  network_project_id               = var.network_project_id
  network                          = var.network
  pod_ip_allocation_range_name     = var.pod_ip_allocation_range_name
  service_ip_allocation_range_name = var.service_ip_allocation_range_name
  subnetwork                       = var.subnetwork
  subnetwork_region                = var.subnetwork_region
  composer_service_account         = local.composer_worker_sa_email
  master_ipv4_cidr                 = var.master_ipv4_cidr
  cloud_sql_ipv4_cidr              = var.cloud_sql_ipv4_cidr
  web_server_allowed_ip_ranges     = var.web_server_allowed_ip_ranges
  airflow_config_overrides         = var.airflow_config_overrides
  env_variables                    = var.env_variables
  image_version                    = var.image_version
  pypi_packages                    = var.pypi_packages
  tags                             = var.tags
  cloud_composer_network_ipv4_cidr_block = var.composer_network_ipv4_cidr
  enable_private_endpoint	         = true
  use_private_environment          = true
  environment_size                 = "ENVIRONMENT_SIZE_LARGE"

  depends_on = [
    module.egress-firewall-rules,
    google_project_iam_member.iam_member_composer_worker_roles,
    google_project_iam_member.iam_member_gke_agent_roles,
    google_project_iam_member.iam_member_gke_cloud_services_roles,
    google_project_iam_member.iam_member_composer_agent_roles
  ]
}

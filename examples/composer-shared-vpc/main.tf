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
  network_tags     = distinct(concat(flatten([for env in var.composer_v1_private_envs : env.tags])))
}

module "shared" {
  source                      = "./shared/"
  prefix                      = var.prefix
  org_id                      = var.org_id
  billing_account             = var.billing_account
  folder_name                 = var.folder_name
  composer_worker_tags        = local.network_tags
  composer_subnets            = var.composer_subnets
  deny_all_egrees_rule_create = var.deny_all_egrees_rule_create
}

module "composer-env" {
  for_each                         = var.composer_v1_private_envs
  source                           = "./composer_v1_pvt_shared_vpc"
  project_id                       = module.shared.service_project_id
  composer_env_name                = each.key
  region                           = each.value.region
  network                          = module.shared.network_name
  network_project_id               = module.shared.host_project_id
  subnetwork                       = each.value.subnet
  subnetwork_region                = each.value.region
  zone                             = each.value.zone
  tags                             = each.value.tags
  pod_ip_allocation_range_name     = each.value.pod_ip_range_name
  service_ip_allocation_range_name = each.value.service_ip_range_name
  cloud_sql_ipv4_cidr              = each.value.cloud_sql_cidr
  web_server_ipv4_cidr             = each.value.web_server_cidr
  master_ipv4_cidr                 = each.value.control_plane_cidr
  firewall_rules_create            = var.deny_all_egrees_rule_create
  airflow_config_overrides         = each.value.software_config.airflow_config_overrides
  env_variables                    = each.value.software_config.env_variables
  image_version                    = each.value.software_config.image_version
  pypi_packages                    = each.value.software_config.pypi_packages
  python_version                   = each.value.software_config.python_version
}

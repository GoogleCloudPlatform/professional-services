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

# tfdoc:file:description Common VPC and related resources.

module "common-project" {
  source          = "../modules/project"
  billing_account = var.billing_account.id
  name            = "prod-net-common-0"
  parent          = var.folder_ids.networking-prod
  prefix          = var.prefix
  services = [
    "compute.googleapis.com",
    "dns.googleapis.com",
    "iap.googleapis.com",
    "networkmanagement.googleapis.com",
    "stackdriver.googleapis.com"
  ]
  shared_vpc_host_config = {
    enabled = true
  }
  iam = {
    "roles/dns.admin" = compact([
      try(local.service_accounts.project-factory-prod, null)
    ])
    (local.custom_roles.service_project_network_admin) = compact([
      try(local.service_accounts.project-factory-prod, null)
    ])
  }
}

module "common-vpc" {
  source     = "../modules/net-vpc"
  project_id = module.common-project.project_id
  name       = "prod-common-0"
  mtu        = 1500
  dns_policy = {
    inbound = true
  }
  # set explicit routes for googleapis in case the default route is deleted
  routes = {
    private-googleapis = {
      dest_range    = "199.36.153.8/30"
      next_hop_type = "gateway"
      next_hop      = "default-internet-gateway"
    }
    restricted-googleapis = {
      dest_range    = "199.36.153.4/30"
      next_hop_type = "gateway"
      next_hop      = "default-internet-gateway"
    }
  }
  data_folder = "${var.data_dir}/subnets/common"
}

module "common-firewall" {
  source     = "../modules/net-vpc-firewall"
  project_id = module.common-project.project_id
  network    = module.common-vpc.name
  default_rules_config = {
    disabled = true
  }
  factories_config = {
    cidr_tpl_file = "${var.data_dir}/cidrs.yaml"
    rules_folder  = "${var.data_dir}/firewall-rules/common"
  }
}

module "common-nat-ew1" {
  source         = "../modules/net-cloudnat"
  project_id     = module.common-project.project_id
  region         = "europe-west1"
  name           = "ew1"
  router_create  = true
  router_name    = "prod-nat-ew1"
  router_network = module.common-vpc.name
  router_asn     = 4200001024
}

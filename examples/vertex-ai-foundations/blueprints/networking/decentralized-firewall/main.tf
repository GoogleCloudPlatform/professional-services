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

###############################################################################
#                           Shared VPC Host projects                          #
###############################################################################

module "project-host-prod" {
  source          = "../../../modules/project"
  parent          = var.root_node
  billing_account = var.billing_account_id
  prefix          = var.prefix
  name            = "prod-host"
  services        = var.project_services

  shared_vpc_host_config = {
    enabled = true
  }
}

module "project-host-dev" {
  source          = "../../../modules/project"
  parent          = var.root_node
  billing_account = var.billing_account_id
  prefix          = var.prefix
  name            = "dev-host"
  services        = var.project_services

  shared_vpc_host_config = {
    enabled = true
  }
}

################################################################################
#                                  Networking                                  #
################################################################################

module "vpc-prod" {
  source     = "../../../modules/net-vpc"
  project_id = module.project-host-prod.project_id
  name       = "prod-vpc"
  subnets = [
    {
      ip_cidr_range = var.ip_ranges.prod
      name          = "prod"
      region        = var.region
    }
  ]
}

module "vpc-dev" {
  source     = "../../../modules/net-vpc"
  project_id = module.project-host-dev.project_id
  name       = "dev-vpc"
  subnets = [
    {
      ip_cidr_range = var.ip_ranges.dev
      name          = "dev"
      region        = var.region
    }
  ]
}

###############################################################################
#                          Private Google Access DNS                          #
###############################################################################

module "dns-api-prod" {
  source          = "../../../modules/dns"
  project_id      = module.project-host-prod.project_id
  type            = "private"
  name            = "googleapis"
  domain          = "googleapis.com."
  client_networks = [module.vpc-prod.self_link]
  recordsets = {
    "CNAME *" = { records = ["private.googleapis.com."] }
  }
}

module "dns-api-dev" {
  source          = "../../../modules/dns"
  project_id      = module.project-host-dev.project_id
  type            = "private"
  name            = "googleapis"
  domain          = "googleapis.com."
  client_networks = [module.vpc-dev.self_link]
  recordsets = {
    "CNAME *" = { records = ["private.googleapis.com."] }
  }
}

###############################################################################
#                             Distributed Firewall                            #
###############################################################################

module "vpc-firewall-prod" {
  source = "../../factories/net-vpc-firewall-yaml"

  project_id = module.project-host-prod.project_id
  network    = module.vpc-prod.name
  config_directories = [
    "${path.module}/firewall/common",
    "${path.module}/firewall/prod"
  ]

  # Enable Firewall Logging for the production fwl rules
  log_config = {
    metadata = "INCLUDE_ALL_METADATA"
  }
}

module "vpc-firewall-dev" {
  source = "../../factories/net-vpc-firewall-yaml"

  project_id = module.project-host-dev.project_id
  network    = module.vpc-dev.name
  config_directories = [
    "${path.module}/firewall/common",
    "${path.module}/firewall/dev"
  ]
}

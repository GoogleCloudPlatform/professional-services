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

# tfdoc:file:description Creates the VPC and manages the firewall rules and ILB.

locals {
  internal_addresses = merge(
    local.listeners,
    local.node_ips,
    {
      "${local.prefix}cluster" = {
        region     = var.region
        subnetwork = local.subnetwork
      }
      (local.witness_netbios_name) = {
        region     = var.region
        subnetwork = local.subnetwork
      }
    }
  )
  internal_address_ips = {
    for k, v in module.ip-addresses.internal_addresses :
    k => v.address
  }
  listeners = {
    for aog in var.always_on_groups : "${local.prefix}lb-${aog}" => {
      region     = var.region
      subnetwork = local.subnetwork
    }
  }
  node_ips = {
    for node_name in local.node_netbios_names : node_name => {
      region     = var.region
      subnetwork = local.subnetwork
    }
  }
}

data "google_compute_zones" "zones" {
  count   = var.project_create == null ? 1 : 0
  project = local.vpc_project
  region  = var.region
}

data "google_compute_subnetwork" "subnetwork" {
  count   = var.project_create == null ? 1 : 0
  project = local.vpc_project
  name    = var.subnetwork
  region  = var.region
}

module "vpc" {
  source = "../../../modules/net-vpc"

  project_id = local.vpc_project
  name       = var.network
  subnets = var.project_create != null ? [
    {
      ip_cidr_range = var.vpc_ip_cidr_range
      name          = var.subnetwork
      region        = var.region
    }
  ] : []
  vpc_create = var.project_create != null ? true : false
}

module "firewall" {
  source     = "../../../modules/net-vpc-firewall"
  project_id = local.vpc_project
  network    = local.network
  default_rules_config = {
    disabled = true
  }
  ingress_rules = {
    "${local.prefix}allow-all-between-wsfc-nodes" = {
      description          = "Allow all between WSFC nodes"
      sources              = [module.compute-service-account.email]
      targets              = [module.compute-service-account.email]
      use_service_accounts = true
      rules = [
        { protocol = "tcp" },
        { protocol = "udp" },
        { protocol = "icmp" }
      ]
    }
    "${local.prefix}allow-all-between-wsfc-witness" = {
      description          = "Allow all between WSFC witness nodes"
      sources              = [module.compute-service-account.email]
      targets              = [module.witness-service-account.email]
      use_service_accounts = true
      rules = [
        { protocol = "tcp" },
        { protocol = "udp" },
        { protocol = "icmp" }
      ]
    }
    "${local.prefix}allow-sql-to-wsfc-nodes" = {
      description          = "Allow SQL connections to WSFC nodes"
      targets              = [module.compute-service-account.email]
      ranges               = var.sql_client_cidrs
      use_service_accounts = true
      rules = [
        { protocol = "tcp", ports = [1433] },
      ]
    }
    "${local.prefix}allow-health-check-to-wsfc-nodes" = {
      description          = "Allow health checks to WSFC nodes"
      targets              = [module.compute-service-account.email]
      ranges               = var.health_check_ranges
      use_service_accounts = true
      rules = [
        { protocol = "tcp" }
      ]
    }
  }
}

module "ip-addresses" {
  source             = "../../../modules/net-address"
  project_id         = local.vpc_project
  internal_addresses = local.internal_addresses
}

module "listener-ilb" {
  source        = "../../../modules/net-ilb"
  for_each      = toset(var.always_on_groups)
  project_id    = var.project_id
  region        = var.region
  name          = "${var.prefix}-${each.value}-ilb"
  service_label = "${var.prefix}-${each.value}-ilb"
  address       = local.internal_address_ips["${local.prefix}lb-${each.value}"]
  vpc_config = {
    network    = local.network
    subnetwork = local.subnetwork
  }
  backends = [for k, node in module.nodes : {
    group = node.group.self_link
  }]
  health_check_config = {
    enable_logging = true
    tcp = {
      port = var.health_check_port
    }
  }
}

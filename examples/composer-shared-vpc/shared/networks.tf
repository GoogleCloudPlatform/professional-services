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
  subnets = [for subnet in keys(var.composer_subnets) : {
    subnet_name           = subnet
    subnet_ip             = var.composer_subnets[subnet].cidr_range
    description           = var.composer_subnets[subnet].description
    subnet_region         = var.composer_subnets[subnet].region
    subnet_private_access = var.composer_subnets[subnet].private_access
    subnet_flow_logs      = var.composer_subnets[subnet].flow_logs
  }]
  secondary_ranges = { for subnet in keys(var.composer_subnets) : subnet => [
    for secondary_range in var.composer_subnets[subnet].secondary_ranges : secondary_range
  ] }
  private_zones = [
    "gcr.io",
    "pkg.dev",
    "googleapis.com",
    "composer.cloud.google.com",
    "composer.googleusercontent.com"
  ]
  shared_vpc_name = "${var.prefix}-composer-shared-vpc"
}


/***************************************
Create Shared VPC with Primary Subnets
****************************************/
module "network" {
  source           = "terraform-google-modules/network/google"
  project_id       = module.project-networking.project_id
  version          = "~> 3.4.0"
  network_name     = local.shared_vpc_name
  shared_vpc_host  = "true"
  routing_mode     = "GLOBAL"
  subnets          = local.subnets
  secondary_ranges = local.secondary_ranges
  mtu              = 1500
}

/******************************************
  Default DNS Policy
 *****************************************/
resource "google_dns_policy" "default_policy" {
  project                   = module.project-networking.project_id
  name                      = "shared-base-default-policy"
  enable_inbound_forwarding = true
  enable_logging            = true
  networks {
    network_url = module.network.network_self_link
  }
}

/********************************************************
Private DNS Zone & records for shared VPC.
*******************************************************/
module "private-dns-zones-shared" {
  for_each    = { for zone in local.private_zones : zone => zone }
  source      = "terraform-google-modules/cloud-dns/google"
  version     = "~> 4.0"
  project_id  = module.project-networking.project_id
  type        = "private"
  name        = "zone-${replace(each.value, ".", "-")}"
  domain      = "${each.value}."
  description = "Private DNS zone to configure ${each.value}"

  private_visibility_config_networks = [
    module.network.network_self_link
  ]
  recordsets = [
    {
      name    = "*"
      type    = "CNAME"
      ttl     = 300
      records = ["${each.value}."]
    },
    {
      name    = ""
      type    = "A"
      ttl     = 300
      records = ["199.36.153.8", "199.36.153.9", "199.36.153.10", "199.36.153.11"]
    },
  ]
}

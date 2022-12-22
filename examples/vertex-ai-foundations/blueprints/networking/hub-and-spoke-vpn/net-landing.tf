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

# tfdoc:file:description Landing hub VPC.

module "landing-vpc" {
  source     = "../../../modules/net-vpc"
  project_id = var.project_id
  name       = "${local.prefix}lnd"
  subnets = [
    {
      ip_cidr_range = var.ip_ranges.land-0-r1
      name          = "${local.prefix}lnd-0"
      region        = var.regions.r1
      secondary_ip_ranges = try(
        var.ip_secondary_ranges.land-0-r1, {}
      )
    },
    {
      ip_cidr_range = var.ip_ranges.land-0-r2
      name          = "${local.prefix}lnd-0"
      region        = var.regions.r2
      secondary_ip_ranges = try(
        var.ip_secondary_ranges.land-0-r2, {}
      )
    }
  ]
}

module "landing-firewall" {
  source     = "../../../modules/net-vpc-firewall"
  project_id = var.project_id
  network    = module.landing-vpc.name
  default_rules_config = {
    admin_ranges = values(var.ip_ranges)
  }
}

module "landing-dns-zone" {
  source          = "../../../modules/dns"
  project_id      = var.project_id
  type            = "private"
  name            = "${local.prefix}example-com"
  domain          = "example.com."
  client_networks = [module.landing-vpc.self_link]
  recordsets = {
    "A localhost" = { records = ["127.0.0.1"] }
    "A test-r1"   = { records = [module.landing-r1-vm.internal_ip] }
  }
}

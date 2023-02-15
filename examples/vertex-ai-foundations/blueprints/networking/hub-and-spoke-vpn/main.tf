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

locals {
  prefix = var.prefix == null ? "" : "${var.prefix}-"
}

# enable services in the project used

module "project" {
  source          = "../../..//modules/project"
  name            = var.project_id
  parent          = try(var.project_create_config.parent, null)
  billing_account = try(var.project_create_config.billing_account_id, null)
  project_create  = try(var.project_create_config.billing_account_id, null) != null
  services = [
    "compute.googleapis.com",
    "dns.googleapis.com"
  ]
}

# test VM in landing region 1

module "landing-r1-vm" {
  source     = "../../../modules/compute-vm"
  project_id = var.project_id
  name       = "${local.prefix}lnd-test-r1"
  zone       = "${var.regions.r1}-b"
  network_interfaces = [{
    network    = module.landing-vpc.self_link
    subnetwork = module.landing-vpc.subnet_self_links["${var.regions.r1}/${local.prefix}lnd-0"]
    nat        = false
    addresses  = null
  }]
  tags = ["ssh"]
}

# test VM in prod region 1

module "prod-r1-vm" {
  source     = "../../../modules/compute-vm"
  project_id = var.project_id
  name       = "${local.prefix}prd-test-r1"
  zone       = "${var.regions.r1}-b"
  network_interfaces = [{
    network    = module.prod-vpc.self_link
    subnetwork = module.prod-vpc.subnet_self_links["${var.regions.r1}/${local.prefix}prd-0"]
    nat        = false
    addresses  = null
  }]
  tags = ["ssh"]
}

# test VM in dev region 1

module "dev-r2-vm" {
  source     = "../../../modules/compute-vm"
  project_id = var.project_id
  name       = "${local.prefix}dev-test-r2"
  zone       = "${var.regions.r2}-b"
  network_interfaces = [{
    network    = module.dev-vpc.self_link
    subnetwork = module.dev-vpc.subnet_self_links["${var.regions.r2}/${local.prefix}dev-0"]
    nat        = false
    addresses  = null
  }]
  tags = ["ssh"]
}

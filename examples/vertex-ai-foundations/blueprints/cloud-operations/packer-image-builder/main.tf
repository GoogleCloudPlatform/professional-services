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
  compute_subnet_name       = "image-builder"
  compute_zone              = "${var.region}-a"
  packer_variables_template = "packer/build.pkrvars.tpl"
  packer_variables_file     = "packer/build.auto.pkrvars.hcl"
}

module "project" {
  source          = "../../../modules/project"
  name            = var.project_id
  parent          = var.root_node
  billing_account = var.billing_account
  project_create  = var.project_create
  services = [
    "compute.googleapis.com"
  ]
}

module "service-account-image-builder" {
  source     = "../../../modules/iam-service-account"
  project_id = module.project.project_id
  name       = "image-builder"
  iam_project_roles = {
    (var.project_id) = [
      "roles/compute.instanceAdmin.v1",
      "roles/iam.serviceAccountUser"
    ]
  }
}

module "service-account-image-builder-vm" {
  source     = "../../../modules/iam-service-account"
  project_id = module.project.project_id
  name       = "image-builder-vm"
}

module "vpc" {
  source     = "../../../modules/net-vpc"
  project_id = module.project.project_id
  name       = "image-builder"
  subnets = [
    {
      name          = local.compute_subnet_name
      ip_cidr_range = var.cidrs.image-builder
      region        = var.region
    }
  ]
}

module "firewall" {
  source     = "../../../modules/net-vpc-firewall"
  project_id = module.project.project_id
  network    = module.vpc.name
  ingress_rules = {
    image-builder-ingress-builder-vm = {
      description          = "Allow image builder vm ingress traffic"
      source_ranges        = var.packer_source_cidrs
      targets              = [module.service-account-image-builder-vm.email]
      use_service_accounts = true
      rules = [{
        protocol = "tcp"
        ports    = [22, 5985, 5986]
      }]
    }
  }
}

module "nat" {
  source                = "../../../modules/net-cloudnat"
  project_id            = module.project.project_id
  region                = var.region
  name                  = "default"
  router_network        = module.vpc.name
  config_source_subnets = "LIST_OF_SUBNETWORKS"
  subnetworks = [
    {
      self_link            = module.vpc.subnet_self_links["${var.region}/${local.compute_subnet_name}"]
      config_source_ranges = ["ALL_IP_RANGES"]
      secondary_ranges     = null
    }
  ]
}

resource "google_service_account_iam_binding" "sa-image-builder-token-creators" {
  count              = length(var.packer_account_users) > 0 ? 1 : 0
  service_account_id = module.service-account-image-builder.service_account.name
  role               = "roles/iam.serviceAccountTokenCreator"
  members            = var.packer_account_users
}

resource "google_project_iam_member" "project-iap-sa-image-builder" {
  count   = var.use_iap ? 1 : 0
  project = var.project_id
  member  = module.service-account-image-builder.iam_email
  role    = "roles/iap.tunnelResourceAccessor"
}

resource "local_file" "packer-vars" {
  count = var.create_packer_vars ? 1 : 0
  content = templatefile(local.packer_variables_template, {
    PROJECT_ID         = "${var.project_id}"
    COMPUTE_ZONE       = "${local.compute_zone}"
    BUILDER_SA         = "${module.service-account-image-builder.email}"
    COMPUTE_SA         = "${module.service-account-image-builder-vm.email}"
    COMPUTE_SUBNETWORK = "${local.compute_subnet_name}"
    USE_IAP            = "${var.use_iap}"
  })
  filename = local.packer_variables_file
}

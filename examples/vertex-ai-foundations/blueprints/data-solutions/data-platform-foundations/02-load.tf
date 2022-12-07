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

# tfdoc:file:description Load project and VPC.

locals {
  load_service_accounts = [
    "serviceAccount:${module.load-project.service_accounts.robots.dataflow}",
    module.load-sa-df-0.iam_email
  ]
  load_subnet = (
    local.use_shared_vpc
    ? var.network_config.subnet_self_links.orchestration
    : values(module.load-vpc.0.subnet_self_links)[0]
  )
  load_vpc = (
    local.use_shared_vpc
    ? var.network_config.network_self_link
    : module.load-vpc.0.self_link
  )
}

# Project

module "load-project" {
  source          = "../../../modules/project"
  parent          = var.folder_id
  billing_account = var.billing_account_id
  prefix          = var.prefix
  name            = "lod${local.project_suffix}"
  group_iam = {
    (local.groups.data-engineers) = [
      "roles/compute.viewer",
      "roles/dataflow.admin",
      "roles/dataflow.developer",
      "roles/viewer",
    ]
  }
  iam = {
    "roles/bigquery.jobUser" = [module.load-sa-df-0.iam_email]
    "roles/dataflow.admin" = [
      module.orch-sa-cmp-0.iam_email, module.load-sa-df-0.iam_email
    ]
    "roles/dataflow.worker"     = [module.load-sa-df-0.iam_email]
    "roles/storage.objectAdmin" = local.load_service_accounts
  }
  services = concat(var.project_services, [
    "bigquery.googleapis.com",
    "bigqueryreservation.googleapis.com",
    "bigquerystorage.googleapis.com",
    "cloudkms.googleapis.com",
    "compute.googleapis.com",
    "dataflow.googleapis.com",
    "dlp.googleapis.com",
    "pubsub.googleapis.com",
    "servicenetworking.googleapis.com",
    "storage.googleapis.com",
    "storage-component.googleapis.com"
  ])
  service_encryption_key_ids = {
    pubsub   = [try(local.service_encryption_keys.pubsub, null)]
    dataflow = [try(local.service_encryption_keys.dataflow, null)]
    storage  = [try(local.service_encryption_keys.storage, null)]
  }
  shared_vpc_service_config = local.shared_vpc_project == null ? null : {
    attach       = true
    host_project = local.shared_vpc_project
  }
}

module "load-sa-df-0" {
  source       = "../../../modules/iam-service-account"
  project_id   = module.load-project.project_id
  prefix       = var.prefix
  name         = "load-df-0"
  display_name = "Data platform Dataflow load service account"
  iam = {
    "roles/iam.serviceAccountTokenCreator" = [local.groups_iam.data-engineers]
    "roles/iam.serviceAccountUser"         = [module.orch-sa-cmp-0.iam_email]
  }
}

module "load-cs-df-0" {
  source         = "../../../modules/gcs"
  project_id     = module.load-project.project_id
  prefix         = var.prefix
  name           = "load-cs-0"
  location       = var.location
  storage_class  = "MULTI_REGIONAL"
  encryption_key = try(local.service_encryption_keys.storage, null)
}

# internal VPC resources

module "load-vpc" {
  source     = "../../../modules/net-vpc"
  count      = local.use_shared_vpc ? 0 : 1
  project_id = module.load-project.project_id
  name       = "${var.prefix}-default"
  subnets = [
    {
      ip_cidr_range = "10.10.0.0/24"
      name          = "default"
      region        = var.region
    }
  ]
}

module "load-vpc-firewall" {
  source     = "../../../modules/net-vpc-firewall"
  count      = local.use_shared_vpc ? 0 : 1
  project_id = module.load-project.project_id
  network    = module.load-vpc.0.name
  default_rules_config = {
    admin_ranges = ["10.10.0.0/24"]
  }
}

module "load-nat" {
  source         = "../../../modules/net-cloudnat"
  count          = local.use_shared_vpc ? 0 : 1
  project_id     = module.load-project.project_id
  name           = "${var.prefix}-default"
  region         = var.region
  router_network = module.load-vpc.0.name
}

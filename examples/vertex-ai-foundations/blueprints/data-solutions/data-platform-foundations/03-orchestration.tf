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

# tfdoc:file:description Orchestration project and VPC.

locals {
  orch_subnet = (
    local.use_shared_vpc
    ? var.network_config.subnet_self_links.orchestration
    : values(module.orch-vpc.0.subnet_self_links)[0]
  )
  orch_vpc = (
    local.use_shared_vpc
    ? var.network_config.network_self_link
    : module.orch-vpc.0.self_link
  )
}

module "orch-project" {
  source          = "../../../modules/project"
  parent          = var.folder_id
  billing_account = var.billing_account_id
  prefix          = var.prefix
  name            = "orc${local.project_suffix}"
  group_iam = {
    (local.groups.data-engineers) = [
      "roles/bigquery.dataEditor",
      "roles/bigquery.jobUser",
      "roles/cloudbuild.builds.editor",
      "roles/composer.admin",
      "roles/composer.environmentAndStorageObjectAdmin",
      "roles/iap.httpsResourceAccessor",
      "roles/iam.serviceAccountUser",
      "roles/storage.objectAdmin",
      "roles/storage.admin",
    ]
  }
  iam = {
    "roles/bigquery.dataEditor" = [
      module.load-sa-df-0.iam_email,
      module.transf-sa-df-0.iam_email,
    ]
    "roles/bigquery.jobUser" = [
      module.orch-sa-cmp-0.iam_email,
    ]
    "roles/composer.worker" = [
      module.orch-sa-cmp-0.iam_email
    ]
    "roles/iam.serviceAccountUser" = [
      module.orch-sa-cmp-0.iam_email
    ]
    "roles/storage.objectAdmin" = [
      module.orch-sa-cmp-0.iam_email,
      "serviceAccount:${module.orch-project.service_accounts.robots.composer}",
    ]
    "roles/storage.objectViewer" = [module.load-sa-df-0.iam_email]
  }
  oslogin = false
  org_policies = {
    "constraints/compute.requireOsLogin" = {
      enforce = false
    }
  }
  services = concat(var.project_services, [
    "artifactregistry.googleapis.com",
    "bigquery.googleapis.com",
    "bigqueryreservation.googleapis.com",
    "bigquerystorage.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudkms.googleapis.com",
    "composer.googleapis.com",
    "compute.googleapis.com",
    "container.googleapis.com",
    "containerregistry.googleapis.com",
    "dataflow.googleapis.com",
    "orgpolicy.googleapis.com",
    "pubsub.googleapis.com",
    "servicenetworking.googleapis.com",
    "storage.googleapis.com",
    "storage-component.googleapis.com"
  ])
  service_encryption_key_ids = {
    composer = [try(local.service_encryption_keys.composer, null)]
    storage  = [try(local.service_encryption_keys.storage, null)]
  }
  shared_vpc_service_config = local.shared_vpc_project == null ? null : {
    attach       = true
    host_project = local.shared_vpc_project
  }
}

# Cloud Storage

module "orch-cs-0" {
  source         = "../../../modules/gcs"
  project_id     = module.orch-project.project_id
  prefix         = var.prefix
  name           = "orc-cs-0"
  location       = var.location
  storage_class  = "MULTI_REGIONAL"
  encryption_key = try(local.service_encryption_keys.storage, null)
}

# internal VPC resources

module "orch-vpc" {
  source     = "../../../modules/net-vpc"
  count      = local.use_shared_vpc ? 0 : 1
  project_id = module.orch-project.project_id
  name       = "${var.prefix}-default"
  subnets = [
    {
      ip_cidr_range = "10.10.0.0/24"
      name          = "default"
      region        = var.region
      secondary_ip_ranges = {
        pods     = "10.10.8.0/22"
        services = "10.10.12.0/24"
      }
    }
  ]
}

module "orch-vpc-firewall" {
  source     = "../../../modules/net-vpc-firewall"
  count      = local.use_shared_vpc ? 0 : 1
  project_id = module.orch-project.project_id
  network    = module.orch-vpc.0.name
  default_rules_config = {
    admin_ranges = ["10.10.0.0/24"]
  }
}

module "orch-nat" {
  count          = local.use_shared_vpc ? 0 : 1
  source         = "../../../modules/net-cloudnat"
  project_id     = module.orch-project.project_id
  name           = "${var.prefix}-default"
  region         = var.region
  router_network = module.orch-vpc.0.name
}

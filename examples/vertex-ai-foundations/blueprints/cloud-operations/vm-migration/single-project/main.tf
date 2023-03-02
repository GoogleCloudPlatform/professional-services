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

module "landing-project" {
  source = "../../../../modules/project"
  billing_account = (var.project_create != null
    ? var.project_create.billing_account_id
    : null
  )
  name = var.project_name
  parent = (var.project_create != null
    ? var.project_create.parent
    : null
  )

  services = [
    "cloudresourcemanager.googleapis.com",
    "compute.googleapis.com",
    "iam.googleapis.com",
    "logging.googleapis.com",
    "networkconnectivity.googleapis.com",
    "servicemanagement.googleapis.com",
    "servicecontrol.googleapis.com",
    "vmmigration.googleapis.com"
  ]

  project_create = var.project_create != null

  iam_additive = {
    "roles/iam.serviceAccountKeyAdmin" = var.migration_admin_users,
    "roles/iam.serviceAccountCreator"  = var.migration_admin_users,
    "roles/vmmigration.admin"          = var.migration_admin_users,
    "roles/vmmigration.viewer"         = var.migration_viewer_users
  }
}

module "m4ce-service-account" {
  source       = "../../../../modules/iam-service-account"
  project_id   = module.landing-project.project_id
  name         = "m4ce-sa"
  generate_key = true
}

module "landing-vpc" {
  source     = "../../../../modules/net-vpc"
  project_id = module.landing-project.project_id
  name       = "landing-vpc"
  subnets = [
    {
      ip_cidr_range = var.vpc_config.ip_cidr_range
      name          = "landing-vpc-${var.vpc_config.region}"
      region        = var.vpc_config.region
    }
  ]
}

module "landing-vpc-firewall" {
  source     = "../../../../modules/net-vpc-firewall"
  project_id = module.landing-project.project_id
  network    = module.landing-vpc.name
}

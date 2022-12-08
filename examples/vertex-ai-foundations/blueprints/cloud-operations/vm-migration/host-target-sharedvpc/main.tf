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

module "host-project" {
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
    "servicemanagement.googleapis.com",
    "servicecontrol.googleapis.com",
    "vmmigration.googleapis.com",
  ]

  project_create = var.project_create != null

  iam_additive = {
    "roles/iam.serviceAccountKeyAdmin" = var.migration_admin_users,
    "roles/iam.serviceAccountCreator"  = var.migration_admin_users,
    "roles/vmmigration.admin"          = var.migration_admin_users,
    "roles/vmmigration.viewer"         = var.migration_viewer_users,
  }
}

module "m4ce-service-account" {
  source     = "../../../../modules/iam-service-account"
  project_id = module.host-project.project_id
  name       = "m4ce-sa"
}

module "target-projects" {

  for_each       = toset(var.migration_target_projects)
  source         = "../../../../modules/project"
  name           = each.key
  project_create = false

  services = [
    "cloudresourcemanager.googleapis.com",
    "compute.googleapis.com",
    "iam.googleapis.com",
    "servicemanagement.googleapis.com",
    "servicecontrol.googleapis.com",
  ]

  iam_additive = {
    "roles/resourcemanager.projectIamAdmin" = var.migration_admin_users,
    "roles/iam.serviceAccountUser"          = var.migration_admin_users,
  }
}

module "sharedvpc_host_project" {

  for_each       = toset(var.sharedvpc_host_projects)
  source         = "../../../../modules/project"
  name           = each.key
  project_create = false

  iam_additive = {
    "roles/compute.viewer" = var.migration_admin_users,
  }
}

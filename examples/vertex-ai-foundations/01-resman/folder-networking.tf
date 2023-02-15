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

# tfdoc:file:description Networking stage resources.

module "folder-network" {
  source = "../modules/folder"
  parent = module.folder-core.id
  name   = "networking"
  group_iam = {
    (local.groups.gcp-network-admins) = [
      # add any needed roles for resources/services not managed via Terraform,
      # or replace editor with ~viewer if no broad resource management needed
      # e.g.
      #   "roles/compute.networkAdmin",
      #   "roles/dns.admin",
      #   "roles/compute.securityAdmin",
      "roles/editor",
    ]
  }
  iam = {
    "roles/logging.admin"                  = [module.branch-network-sa.iam_email]
    "roles/owner"                          = [module.branch-network-sa.iam_email]
    "roles/resourcemanager.folderAdmin"    = [module.branch-network-sa.iam_email]
    "roles/resourcemanager.projectCreator" = [module.branch-network-sa.iam_email]
    "roles/compute.xpnAdmin"               = [module.branch-network-sa.iam_email]
  }
  tag_bindings = {
    context = try(
      module.organization.tag_values["${var.tag_names.context}/networking"].id, null
    )
  }
}

module "folder-network-prod" {
  source = "../modules/folder"
  parent = module.folder-network.id
  name   = "prod"
  iam = {
    (local.custom_roles.service_project_network_admin) = concat(
      local.branch_optional_sa_lists.dp-prod,
      #local.branch_optional_sa_lists.gke-prod,
      local.branch_optional_sa_lists.pf-prod,
    )
  }
  tag_bindings = {
    environment = try(
      module.organization.tag_values["${var.tag_names.environment}/production"].id,
      null
    )
  }
}

module "folder-network-dev" {
  source = "../modules/folder"
  parent = module.folder-network.id
  name   = "dev"
  iam = {
    (local.custom_roles.service_project_network_admin) = concat(
      local.branch_optional_sa_lists.dp-dev,
      #local.branch_optional_sa_lists.gke-dev,
      local.branch_optional_sa_lists.pf-dev,
    )
  }
  tag_bindings = {
    environment = try(
      module.organization.tag_values["${var.tag_names.environment}/development"].id,
      null
    )
  }
}

# automation service account and bucket

module "branch-network-sa" {
  source       = "../modules/iam-service-account"
  project_id   = var.automation.project_id
  name         = "prod-resman-net-0"
  display_name = "Terraform resman networking service account."
  prefix       = var.prefix
  iam = {
    "roles/iam.serviceAccountTokenCreator" = compact([
      try(module.branch-network-sa-cicd.0.iam_email, null)
    ])
  }
  iam_storage_roles = {
    (var.automation.outputs_bucket) = ["roles/storage.admin"]
  }
}

module "branch-network-gcs" {
  source        = "../modules/gcs"
  project_id    = var.automation.project_id
  name          = "prod-resman-net-0"
  prefix        = var.prefix
  location      = var.locations.gcs
  storage_class = local.gcs_storage_class
  versioning    = true
  iam = {
    "roles/storage.objectAdmin" = [module.branch-network-sa.iam_email]
  }
}

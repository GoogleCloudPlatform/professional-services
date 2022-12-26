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

# tfdoc:file:description Team stage resources.

# TODO(ludo): add support for CI/CD

############### top-level Teams branch and automation resources ###############

module "branch-teams-folder" {
  source = "../modules/folder"
  count  = var.fast_features.teams ? 1 : 0
  parent = "organizations/${var.organization.id}"
  name   = "Teams"
  iam = {
    "roles/logging.admin"                  = [module.branch-teams-sa.0.iam_email]
    "roles/owner"                          = [module.branch-teams-sa.0.iam_email]
    "roles/resourcemanager.folderAdmin"    = [module.branch-teams-sa.0.iam_email]
    "roles/resourcemanager.projectCreator" = [module.branch-teams-sa.0.iam_email]
    "roles/compute.xpnAdmin"               = [module.branch-teams-sa.0.iam_email]
  }
  tag_bindings = {
    context = try(
      module.organization.tag_values["${var.tag_names.context}/teams"].id, null
    )
  }
}

module "branch-teams-sa" {
  source       = "../modules/iam-service-account"
  count        = var.fast_features.teams ? 1 : 0
  project_id   = var.automation.project_id
  name         = "prod-resman-teams-0"
  display_name = "Terraform resman teams service account."
  prefix       = var.prefix
  iam_storage_roles = {
    (var.automation.outputs_bucket) = ["roles/storage.admin"]
  }
}

module "branch-teams-gcs" {
  source        = "../modules/gcs"
  count         = var.fast_features.teams ? 1 : 0
  project_id    = var.automation.project_id
  name          = "prod-resman-teams-0"
  prefix        = var.prefix
  location      = var.locations.gcs
  storage_class = local.gcs_storage_class
  versioning    = true
  iam = {
    "roles/storage.objectAdmin" = [module.branch-teams-sa.0.iam_email]
  }
}

################## per-team folders and automation resources ##################

module "branch-teams-team-folder" {
  source   = "../modules/folder"
  for_each = var.fast_features.teams ? coalesce(var.team_folders, {}) : {}
  parent   = module.branch-teams-folder.0.id
  name     = each.value.descriptive_name
  iam = {
    "roles/logging.admin"                  = [module.branch-teams-team-sa[each.key].iam_email]
    "roles/owner"                          = [module.branch-teams-team-sa[each.key].iam_email]
    "roles/resourcemanager.folderAdmin"    = [module.branch-teams-team-sa[each.key].iam_email]
    "roles/resourcemanager.projectCreator" = [module.branch-teams-team-sa[each.key].iam_email]
    "roles/compute.xpnAdmin"               = [module.branch-teams-team-sa[each.key].iam_email]
  }
  group_iam = each.value.group_iam == null ? {} : each.value.group_iam
}

module "branch-teams-team-sa" {
  source       = "../modules/iam-service-account"
  for_each     = var.fast_features.teams ? coalesce(var.team_folders, {}) : {}
  project_id   = var.automation.project_id
  name         = "prod-teams-${each.key}-0"
  display_name = "Terraform team ${each.key} service account."
  prefix       = var.prefix
  iam = {
    "roles/iam.serviceAccountTokenCreator" = (
      each.value.impersonation_groups == null
      ? []
      : [for g in each.value.impersonation_groups : "group:${g}"]
    )
  }
}

module "branch-teams-team-gcs" {
  source        = "../modules/gcs"
  for_each      = var.fast_features.teams ? coalesce(var.team_folders, {}) : {}
  project_id    = var.automation.project_id
  name          = "prod-teams-${each.key}-0"
  prefix        = var.prefix
  location      = var.locations.gcs
  storage_class = local.gcs_storage_class
  versioning    = true
  iam = {
    "roles/storage.objectAdmin" = [module.branch-teams-team-sa[each.key].iam_email]
  }
}

# per-team environment folders where project factory SAs can create projects

module "branch-teams-team-dev-folder" {
  source   = "../modules/folder"
  for_each = var.fast_features.teams ? coalesce(var.team_folders, {}) : {}
  parent   = module.branch-teams-team-folder[each.key].id
  # naming: environment descriptive name
  name = "Development"
  # environment-wide human permissions on the whole teams environment
  group_iam = {}
  iam = {
    (local.custom_roles.service_project_network_admin) = (
      local.branch_optional_sa_lists.pf-dev
    )
    # remove owner here and at project level if SA does not manage project resources
    "roles/owner"                          = local.branch_optional_sa_lists.pf-dev
    "roles/logging.admin"                  = local.branch_optional_sa_lists.pf-dev
    "roles/resourcemanager.folderAdmin"    = local.branch_optional_sa_lists.pf-dev
    "roles/resourcemanager.projectCreator" = local.branch_optional_sa_lists.pf-dev
  }
  tag_bindings = {
    environment = try(
      module.organization.tag_values["${var.tag_names.environment}/development"].id, null
    )
  }
}

module "branch-teams-team-prod-folder" {
  source   = "../modules/folder"
  for_each = var.fast_features.teams ? coalesce(var.team_folders, {}) : {}
  parent   = module.branch-teams-team-folder[each.key].id
  # naming: environment descriptive name
  name = "Production"
  # environment-wide human permissions on the whole teams environment
  group_iam = {}
  iam = {
    (local.custom_roles.service_project_network_admin) = (
      local.branch_optional_sa_lists.pf-prod
    )
    # remove owner here and at project level if SA does not manage project resources
    "roles/owner"                          = local.branch_optional_sa_lists.pf-prod
    "roles/logging.admin"                  = local.branch_optional_sa_lists.pf-prod
    "roles/resourcemanager.folderAdmin"    = local.branch_optional_sa_lists.pf-prod
    "roles/resourcemanager.projectCreator" = local.branch_optional_sa_lists.pf-prod
  }
  tag_bindings = {
    environment = try(
      module.organization.tag_values["${var.tag_names.environment}/production"].id, null
    )
  }
}

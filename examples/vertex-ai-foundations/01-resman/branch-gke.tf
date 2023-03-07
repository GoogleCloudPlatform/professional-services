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

# tfdoc:file:description GKE multitenant stage resources.

#module "branch-gke-folder" {
#  source = "../modules/folder"
#  count  = var.fast_features.gke ? 1 : 0
#  parent = "organizations/${var.organization.id}"
#  name   = "GKE"
#  tag_bindings = {
#    context = try(
#      module.organization.tag_values["${var.tag_names.context}/gke"].id, null
#    )
#  }
#}
#
#module "branch-gke-dev-folder" {
#  source = "../modules/folder"
#  count  = var.fast_features.gke ? 1 : 0
#  parent = module.branch-gke-folder.0.id
#  name   = "Development"
#  iam = {
#    "roles/owner"                          = [module.branch-gke-dev-sa.0.iam_email]
#    "roles/logging.admin"                  = [module.branch-gke-dev-sa.0.iam_email]
#    "roles/resourcemanager.folderAdmin"    = [module.branch-gke-dev-sa.0.iam_email]
#    "roles/resourcemanager.projectCreator" = [module.branch-gke-dev-sa.0.iam_email]
#    "roles/compute.xpnAdmin"               = [module.branch-gke-dev-sa.0.iam_email]
#  }
#  tag_bindings = {
#    context = try(
#      module.organization.tag_values["${var.tag_names.environment}/development"].id,
#      null
#    )
#  }
#}
#
#module "branch-gke-prod-folder" {
#  source = "../modules/folder"
#  count  = var.fast_features.gke ? 1 : 0
#  parent = module.branch-gke-folder.0.id
#  name   = "Production"
#  iam = {
#    "roles/owner"                          = [module.branch-gke-prod-sa.0.iam_email]
#    "roles/logging.admin"                  = [module.branch-gke-prod-sa.0.iam_email]
#    "roles/resourcemanager.folderAdmin"    = [module.branch-gke-prod-sa.0.iam_email]
#    "roles/resourcemanager.projectCreator" = [module.branch-gke-prod-sa.0.iam_email]
#    "roles/compute.xpnAdmin"               = [module.branch-gke-prod-sa.0.iam_email]
#  }
#  tag_bindings = {
#    context = try(
#      module.organization.tag_values["${var.tag_names.environment}/production"].id,
#      null
#    )
#  }
#}
#
#module "branch-gke-dev-sa" {
#  source       = "../modules/iam-service-account"
#  count        = var.fast_features.gke ? 1 : 0
#  project_id   = var.automation.project_id
#  name         = "dev-resman-gke-0"
#  display_name = "Terraform gke multitenant dev service account."
#  prefix       = var.prefix
#  iam = {
#    "roles/iam.serviceAccountTokenCreator" = concat(
#      ["group:${local.groups.gcp-devops}"],
#      compact([
#        try(module.branch-gke-dev-sa-cicd.0.iam_email, null)
#      ])
#    )
#  }
#  iam_storage_roles = {
#    (var.automation.outputs_bucket) = ["roles/storage.admin"]
#  }
#}
#
#module "branch-gke-prod-sa" {
#  source       = "../modules/iam-service-account"
#  count        = var.fast_features.gke ? 1 : 0
#  project_id   = var.automation.project_id
#  name         = "prod-resman-gke-0"
#  display_name = "Terraform gke multitenant prod service account."
#  prefix       = var.prefix
#  iam = {
#    "roles/iam.serviceAccountTokenCreator" = concat(
#      ["group:${local.groups.gcp-devops}"],
#      compact([
#        try(module.branch-gke-prod-sa-cicd.0.iam_email, null)
#      ])
#    )
#  }
#  iam_storage_roles = {
#    (var.automation.outputs_bucket) = ["roles/storage.admin"]
#  }
#}
#
#module "branch-gke-dev-gcs" {
#  source     = "../modules/gcs"
#  count      = var.fast_features.gke ? 1 : 0
#  project_id = var.automation.project_id
#  name       = "dev-resman-gke-0"
#  prefix     = var.prefix
#  versioning = true
#  iam = {
#    "roles/storage.objectAdmin" = [module.branch-gke-dev-sa.0.iam_email]
#  }
#}
#
#module "branch-gke-prod-gcs" {
#  source     = "../modules/gcs"
#  count      = var.fast_features.gke ? 1 : 0
#  project_id = var.automation.project_id
#  name       = "prod-resman-gke-0"
#  prefix     = var.prefix
#  versioning = true
#  iam = {
#    "roles/storage.objectAdmin" = [module.branch-gke-prod-sa.0.iam_email]
#  }
#}
#
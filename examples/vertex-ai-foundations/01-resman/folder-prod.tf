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


module "folder-prod" {
  source = "../modules/folder"
  parent = "organizations/${var.organization.id}"
  name   = "prod"
  iam = {
    "roles/logging.admin"                  = [module.branch-env-prod-sa.iam_email]
    "roles/owner"                          = [module.branch-env-prod-sa.iam_email]
    "roles/resourcemanager.folderAdmin"    = [module.branch-env-prod-sa.iam_email]
    "roles/resourcemanager.projectCreator" = [module.branch-env-prod-sa.iam_email]
  }
  org_policies = {
    "constraints/sql.restrictPublicIp"       = { enforce = false }
    "constraints/compute.vmExternalIpAccess" = { allow = { all = true } }
  }
  tag_bindings = {
    context = try(
      module.organization.tag_values["${var.tag_names.context}/prod"].id, null
    )
  }
}

module "folder-prod-sharedinfra" {
  source = "../modules/folder"
  parent = module.folder-prod.id
  name   = "sharedinfra"
  iam = {
    "roles/logging.admin"                  = [module.branch-env-prod-sa.iam_email]
    "roles/owner"                          = [module.branch-env-prod-sa.iam_email]
    "roles/resourcemanager.folderAdmin"    = [module.branch-env-prod-sa.iam_email]
    "roles/resourcemanager.projectCreator" = [module.branch-env-prod-sa.iam_email]
  }
  org_policies = {
    "constraints/sql.restrictPublicIp"       = { enforce = false }
    "constraints/compute.vmExternalIpAccess" = { allow = { all = true } }
  }
  tag_bindings = {
    context = try(
      module.organization.tag_values["${var.tag_names.context}/prod"].id, null
    )
  }
}

module "branch-env-prod-sa" {
  source       = "../modules/iam-service-account"
  #count        = var.fast_features.teams ? 1 : 0
  project_id   = var.automation.project_id
  name         = "prod-resman-env-prod-0"
  display_name = "Terraform resman prod environment service account."
  prefix       = var.prefix
  iam_storage_roles = {
    (var.automation.outputs_bucket) = ["roles/storage.admin"]
  }
}


#module "branch-sandbox-gcs" {
#  source        = "../modules/gcs"
#  count         = var.fast_features.sandbox ? 1 : 0
#  project_id    = var.automation.project_id
#  name          = "dev-resman-sbox-0"
#  prefix        = var.prefix
#  location      = var.locations.gcs
#  storage_class = local.gcs_storage_class
#  versioning    = true
#  iam = {
#    "roles/storage.objectAdmin" = [module.branch-sandbox-sa.0.iam_email]
#  }
#}
#
#moved {
#  from = module.branch-sandbox-sa
#  to   = module.branch-sandbox-sa.0
#}
#
#module "branch-sandbox-sa" {
#  source       = "../modules/iam-service-account"
#  count        = var.fast_features.sandbox ? 1 : 0
#  project_id   = var.automation.project_id
#  name         = "dev-resman-sbox-0"
#  display_name = "Terraform resman sandbox service account."
#  prefix       = var.prefix
#}
#
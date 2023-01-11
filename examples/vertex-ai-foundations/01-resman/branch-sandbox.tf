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

# tfdoc:file:description Sandbox stage resources.

moved {
  from = module.branch-sandbox-folder
  to   = module.branch-sandbox-folder.0
}

module "folder-sandbox" {
  source = "../modules/folder"
  count  = var.fast_features.sandbox ? 1 : 0
  parent = "organizations/${var.organization.id}"
  name   = "sandbox"
  iam = {
    "roles/logging.admin"                  = [module.branch-sandbox-sa.0.iam_email]
    "roles/owner"                          = [module.branch-sandbox-sa.0.iam_email]
    "roles/resourcemanager.folderAdmin"    = [module.branch-sandbox-sa.0.iam_email]
    "roles/resourcemanager.projectCreator" = [module.branch-sandbox-sa.0.iam_email]
  }
  org_policies = {
    "constraints/sql.restrictPublicIp"       = { enforce = false }
    "constraints/compute.vmExternalIpAccess" = { allow = { all = true } }
  }
  tag_bindings = {
    context = try(
      module.organization.tag_values["${var.tag_names.context}/sandbox"].id, null
    )
  }
}

moved {
  from = module.branch-sandbox-gcs
  to   = module.branch-sandbox-gcs.0
}

module "branch-sandbox-gcs" {
  source        = "../modules/gcs"
  count         = var.fast_features.sandbox ? 1 : 0
  project_id    = var.automation.project_id
  name          = "dev-resman-sbox-0"
  prefix        = var.prefix
  location      = var.locations.gcs
  storage_class = local.gcs_storage_class
  versioning    = true
  iam = {
    "roles/storage.objectAdmin" = [module.branch-sandbox-sa.0.iam_email]
  }
}

moved {
  from = module.branch-sandbox-sa
  to   = module.branch-sandbox-sa.0
}

module "branch-sandbox-sa" {
  source       = "../modules/iam-service-account"
  count        = var.fast_features.sandbox ? 1 : 0
  project_id   = var.automation.project_id
  name         = "dev-resman-sbox-0"
  display_name = "Terraform resman sandbox service account."
  prefix       = var.prefix
}

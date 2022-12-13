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

# tfdoc:file:description Security stage resources.

module "folder-security" {
  source = "../modules/folder"
  parent = module.folder-core.id
  name   = "security"
  group_iam = {
    (local.groups.gcp-security-admins) = [
      # add any needed roles for resources/services not managed via Terraform,
      # e.g.
      # "roles/bigquery.admin",
      # "roles/cloudasset.owner",
      # "roles/cloudkms.admin",
      # "roles/logging.admin",
      # "roles/secretmanager.admin",
      # "roles/storage.admin",
      "roles/viewer"
    ]
  }
  iam = {
    "roles/logging.admin"                  = [module.branch-security-sa.iam_email]
    "roles/owner"                          = [module.branch-security-sa.iam_email]
    "roles/resourcemanager.folderAdmin"    = [module.branch-security-sa.iam_email]
    "roles/resourcemanager.projectCreator" = [module.branch-security-sa.iam_email]
  }
  tag_bindings = {
    context = try(
      module.organization.tag_values["${var.tag_names.context}/security"].id, null
    )
  }
}

# automation service account and bucket

module "branch-security-sa" {
  source       = "../modules/iam-service-account"
  project_id   = var.automation.project_id
  name         = "prod-resman-sec-0"
  display_name = "Terraform resman security service account."
  prefix       = var.prefix
  iam = {
    "roles/iam.serviceAccountTokenCreator" = compact([
      try(module.branch-security-sa-cicd.0.iam_email, null)
    ])
  }
  iam_storage_roles = {
    (var.automation.outputs_bucket) = ["roles/storage.admin"]
  }
}

module "branch-security-gcs" {
  source        = "../modules/gcs"
  project_id    = var.automation.project_id
  name          = "prod-resman-sec-0"
  prefix        = var.prefix
  location      = var.locations.gcs
  storage_class = local.gcs_storage_class
  versioning    = true
  iam = {
    "roles/storage.objectAdmin" = [module.branch-security-sa.iam_email]
  }
}

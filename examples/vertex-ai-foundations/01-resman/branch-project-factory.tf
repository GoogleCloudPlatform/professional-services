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

# tfdoc:file:description Project factory stage resources.

module "branch-pf-dev-sa" {
  source     = "../modules/iam-service-account"
  count      = var.fast_features.project_factory ? 1 : 0
  project_id = var.automation.project_id
  name       = "dev-resman-pf-0"
  # naming: environment in description
  display_name = "Terraform project factory development service account."
  prefix       = var.prefix
  iam = {
    "roles/iam.serviceAccountTokenCreator" = compact([
      try(module.branch-pf-dev-sa-cicd.0.iam_email, null)
    ])
  }
  iam_storage_roles = {
    (var.automation.outputs_bucket) = ["roles/storage.admin"]
  }
}

module "branch-pf-prod-sa" {
  source     = "../modules/iam-service-account"
  count      = var.fast_features.project_factory ? 1 : 0
  project_id = var.automation.project_id
  name       = "prod-resman-pf-0"
  # naming: environment in description
  display_name = "Terraform project factory production service account."
  prefix       = var.prefix
  iam = {
    "roles/iam.serviceAccountTokenCreator" = compact([
      try(module.branch-pf-prod-sa-cicd.0.iam_email, null)
    ])
  }
  iam_storage_roles = {
    (var.automation.outputs_bucket) = ["roles/storage.admin"]
  }
}

module "branch-pf-dev-gcs" {
  source        = "../modules/gcs"
  count         = var.fast_features.project_factory ? 1 : 0
  project_id    = var.automation.project_id
  name          = "dev-resman-pf-0"
  prefix        = var.prefix
  location      = var.locations.gcs
  storage_class = local.gcs_storage_class
  versioning    = true
  iam = {
    "roles/storage.objectAdmin" = [module.branch-pf-dev-sa.0.iam_email]
  }
}

module "branch-pf-prod-gcs" {
  source        = "../modules/gcs"
  count         = var.fast_features.project_factory ? 1 : 0
  project_id    = var.automation.project_id
  name          = "prod-resman-pf-0"
  prefix        = var.prefix
  location      = var.locations.gcs
  storage_class = local.gcs_storage_class
  versioning    = true
  iam = {
    "roles/storage.objectAdmin" = [module.branch-pf-prod-sa.0.iam_email]
  }
}

/**
 * Copyright 2023 Google LLC
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

# tfdoc:file:description Vertex MLOps

locals {
  bucket_name = "${var.bucket_name}-${var.environment}"
  env_label = {
    "env" : "${var.environment}"
  }
  labels = merge(local.env_label, var.labels)

  github = {
    organization = var.github.organization
    repo         = var.github.repo
    branch       = var.environment
  }

  identity_pool_claims = try("attribute.repository/${var.github.organization}/${var.github.repo}", null)

  project_config = {
    billing_account_id = var.project_config.billing_account_id
    parent             = var.project_config.parent
    project_id         = "${var.project_config.project_id}"
  }

}
module "mlops" {
  source                  = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//blueprints/data-solutions/vertex-mlops"
  project_config          = local.project_config
  prefix                  = var.prefix
  bucket_name             = local.bucket_name
  dataset_name            = var.dataset_name
  groups                  = var.groups
  identity_pool_claims    = local.identity_pool_claims
  labels                  = local.labels
  notebooks               = var.notebooks
  service_encryption_keys = var.service_encryption_keys
}

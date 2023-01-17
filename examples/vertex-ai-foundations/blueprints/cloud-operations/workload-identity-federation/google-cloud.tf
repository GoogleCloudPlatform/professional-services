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

module "prj" {
  source = "../../../modules/project"
  billing_account = (var.project_create != null
    ? var.project_create.billing_account_id
    : null
  )
  parent = (var.project_create != null
    ? var.project_create.parent
    : null
  )
  name = var.project_id
  services = [
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
  ]
  project_create = var.project_create != null
  iam_additive = {
    "roles/viewer" : [module.sa.iam_email]
  }
}

resource "google_iam_workload_identity_pool" "pool" {
  provider                  = google-beta
  project                   = module.prj.project_id
  workload_identity_pool_id = "test-pool"
}

resource "google_iam_workload_identity_pool_provider" "provider" {
  provider                           = google-beta
  project                            = module.prj.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "test-provider"
  attribute_mapping = {
    "google.subject" = "assertion.sub"
  }
  oidc {
    allowed_audiences = ["api://${local.app_name}"]
    issuer_uri        = "https://sts.windows.net/${data.azuread_client_config.config.tenant_id}"
  }
}

module "sa" {
  source     = "../../../modules/iam-service-account"
  project_id = module.prj.project_id
  name       = "sa-test"
  iam = {
    "roles/iam.workloadIdentityUser" = [
      "principalSet://iam.googleapis.com/projects/${module.prj.number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.pool.workload_identity_pool_id}/*"
    ]
  }
}

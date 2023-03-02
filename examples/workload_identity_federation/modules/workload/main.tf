# Copyright 2019 Google LLC
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


resource "random_id" "random" {
  byte_length = 4
}

resource "google_iam_workload_identity_pool" "gitlab-pool" {
  provider                  = google-beta
  workload_identity_pool_id = "gitlab-pool-${random_id.random.hex}"
  project                   = var.gcp_project_id
}

resource "google_iam_workload_identity_pool_provider" "gitlab-provider-jwt" {
  provider                           = google-beta
  workload_identity_pool_id          = google_iam_workload_identity_pool.gitlab-pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "gitlab-jwt-${random_id.random.hex}"
  project                            = var.gcp_project_id
  attribute_condition                = ""
  attribute_mapping = {
    "google.subject"           = "assertion.sub",
    "attribute.aud"            = "assertion.aud",
    "attribute.project_path"   = "assertion.project_path",
    "attribute.project_id"     = "assertion.project_id",
    "attribute.namespace_id"   = "assertion.namespace_id",
    "attribute.namespace_path" = "assertion.namespace_path",
    "attribute.user_email"     = "assertion.user_email",
    "attribute.ref"            = "assertion.ref",
    "attribute.ref_type"       = "assertion.ref_type",
  }
  oidc {
    issuer_uri        = var.gitlab_url
    allowed_audiences = [var.gitlab_url]
  }
}

resource "google_service_account" "gitlab-runner" {
  project      = var.gcp_project_id
  account_id   = var.gitlab_service_account
  display_name = "Service Account for GitLab Runner"
}

resource "google_service_account_iam_binding" "gitlab-runner-oidc" {
  provider           = google-beta
  service_account_id = google_service_account.gitlab-runner.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.gitlab-pool.name}/attribute.project_id/${var.gitlab_project_id}"
  ]
}




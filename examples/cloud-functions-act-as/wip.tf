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

resource "google_iam_workload_identity_pool" "wi-pool" {
  provider                  = google-beta
  workload_identity_pool_id = "${var.wi_pool_name}-${random_string.wi-random.result}"
}

resource "google_iam_workload_identity_pool_provider" "wip-github" {
  provider                           = google-beta
  workload_identity_pool_id          = google_iam_workload_identity_pool.wi-pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "wip-github"
  attribute_mapping                  = {
    "google.subject" = "assertion.sub"
  }
  oidc {
    issuer_uri        = "https://token.actions.githubusercontent.com/"
  }
}

resource "random_string" "wi-random" {
  length           = 4
  special          = false
  upper            = false
}
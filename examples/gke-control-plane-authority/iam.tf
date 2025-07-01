/**
 * Copyright 2025 Google LLC
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

data "google_iam_policy" "sa_signing_iam_policy" {
  binding {
    members = [
      "serviceAccount:${google_project_service_identity.privateca-sa.email}",
    ]
    role = "roles/cloudkms.signerVerifier"
  }
  binding {
    members = [
      "serviceAccount:${local.gke_service_agent}",
    ]
    role = "roles/container.cloudKmsKeyUser"
  }
  binding {
    members = [
      "serviceAccount:${google_project_service_identity.privateca-sa.email}",
    ]
    role = "roles/cloudkms.viewer"
  }
}

data "google_iam_policy" "ca_pool_iam_policy" {
  binding {
    role = "roles/privateca.certificateManager"
    members = [
      "serviceAccount:${local.gke_service_agent}",
    ]
  }
}

resource "google_kms_crypto_key_iam_policy" "sa-signing-keys-iam" {
  depends_on    = [google_kms_crypto_key.sa-signing-keys]
  for_each      = { for key in google_kms_crypto_key.sa-signing-keys : key.name => key.id }
  crypto_key_id = each.value
  policy_data   = data.google_iam_policy.sa_signing_iam_policy.policy_data
}

resource "google_kms_crypto_key_iam_policy" "cluster-signing-keys-iam" {
  depends_on    = [google_kms_crypto_key.cluster-signing-keys]
  for_each      = { for key in google_kms_crypto_key.cluster-signing-keys : key.name => key.id }
  crypto_key_id = each.value
  policy_data   = data.google_iam_policy.sa_signing_iam_policy.policy_data
}

resource "google_privateca_ca_pool_iam_policy" "ca-pools-iam" {
  depends_on  = [google_privateca_ca_pool.ca-pools]
  for_each    = { for key in google_privateca_ca_pool.ca-pools : key.name => key.id }
  ca_pool     = each.value
  policy_data = data.google_iam_policy.ca_pool_iam_policy.policy_data
}

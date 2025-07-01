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

resource "google_kms_key_ring" "hsm-keyring" {
  name     = "${var.cluster_name}-keyring-${local.suffix}"
  location = var.region

}

resource "google_kms_crypto_key" "sa-signing-keys" {
  for_each = toset(local.k8s_sa_signing_keys)
  name     = each.key
  key_ring = google_kms_key_ring.hsm-keyring.id
  purpose  = "ASYMMETRIC_SIGN"

  version_template {
    algorithm        = "RSA_SIGN_PKCS1_4096_SHA256"
    protection_level = "HSM"
  }

  lifecycle {
    prevent_destroy = false
  }
  labels = local.labels
}

data "google_kms_crypto_key_latest_version" "sa-signing-keys-version" {
  depends_on = [google_kms_crypto_key.sa-signing-keys]
  for_each   = { for key in google_kms_crypto_key.sa-signing-keys : key.name => key.id }
  crypto_key = each.value
}

resource "google_kms_crypto_key" "cluster-signing-keys" {
  for_each = toset(local.k8s_cluster_signing_keys)
  name     = each.key
  key_ring = google_kms_key_ring.hsm-keyring.id
  purpose  = "ASYMMETRIC_SIGN"

  version_template {
    algorithm        = "EC_SIGN_P256_SHA256"
    protection_level = "HSM"
  }

  lifecycle {
    prevent_destroy = false
  }
  labels = local.labels
}

data "google_kms_crypto_key_latest_version" "cluster-signing-keys-version" {
  depends_on = [google_kms_crypto_key.cluster-signing-keys]
  for_each   = { for key in google_kms_crypto_key.cluster-signing-keys : key.name => key.id }
  crypto_key = each.value
}

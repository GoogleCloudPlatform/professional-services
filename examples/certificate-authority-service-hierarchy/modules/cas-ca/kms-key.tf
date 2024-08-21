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

resource "random_string" "keyring_suffix" {
  keepers = {
    env = var.ca_name
  }
  length           = 4
  special          = false
  lower            = true
  upper            = false
}

resource "random_string" "key_suffix" {
  length           = 4
  special          = false
  lower            = true
  upper            = false
}

resource "google_kms_key_ring" "ca_keyring" {
  name      = "ca-${random_string.keyring_suffix.keepers.env}-${random_string.keyring_suffix.result}"
  location  = var.location

  # According to the documentation: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/kms_key_ring
  # the following setting is optional and "provider project" is getting taken by default.
  # So far it didn't work without this setting set explicitly.
  project   = var.project_id   
}

resource "google_kms_crypto_key" "ca_key" {
  name            = "ca-${random_string.keyring_suffix.keepers.env}-${random_string.key_suffix.result}"
  key_ring        = google_kms_key_ring.ca_keyring.id
  purpose         = "ASYMMETRIC_SIGN"
  version_template {
    protection_level = "HSM"
    algorithm = var.algorithm
  }

  # This key is a placeholder for import, no need in first version
  # skip_initial_version_creation = true

  # rotation_period is not available for keys with purpose ASYMMETRIC_SIGN
  # rotation_period = "100000s"

  # lifecycle {
  #   prevent_destroy = true
  # }
}

# The following is a configuration example for the manual Cloud HSM custom key import
/* 
resource "google_kms_crypto_key_version" "ca_key_version" {
  crypto_key = google_kms_crypto_key.ca_key.id
}

resource "google_kms_key_ring_import_job" "key-import-job" {
  key_ring = google_kms_key_ring.ca_keyring.id
  import_job_id = "key-import-job-${random_string.keyring_suffix.keepers.env}-${random_string.key_suffix.result}"

  import_method = "RSA_OAEP_3072_SHA1_AES_256"
  protection_level = "HSM"
}
*/

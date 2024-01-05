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

resource "google_kms_crypto_key_iam_binding" "privateca_sa_keyuser_signerverifier" {
  crypto_key_id = google_kms_crypto_key.ca_key.id
  role          = "roles/cloudkms.signerVerifier"
  members = [
    "serviceAccount:${google_project_service_identity.privateca_sa.email}",
  ]
}

resource "google_kms_crypto_key_iam_binding" "privateca_sa_keyuser_viewer" {
  crypto_key_id = google_kms_crypto_key.ca_key.id
  role          = "roles/viewer"
  members = [
    "serviceAccount:${google_project_service_identity.privateca_sa.email}",
  ]
}

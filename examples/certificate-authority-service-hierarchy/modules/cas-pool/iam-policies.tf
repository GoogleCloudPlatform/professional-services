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

resource "google_privateca_ca_pool_iam_binding" "ca-cert-manager-members" {
  ca_pool = google_privateca_ca_pool.pool.id
  role = "roles/privateca.certificateManager"
  members = var.cert_managers
}

resource "google_privateca_ca_pool_iam_binding" "ca-cert-requester-members" {
  ca_pool = google_privateca_ca_pool.pool.id
  role = "roles/privateca.certificateRequester"
  members = var.cert_requesters
}

resource "google_privateca_ca_pool_iam_binding" "ca-workload-cert-requester-members" {
  ca_pool = google_privateca_ca_pool.pool.id
  role = "roles/privateca.workloadCertificateRequester"
  members = var.workload_cert_requesters
}

resource "google_privateca_ca_pool_iam_binding" "ca-auditor-members" {
  ca_pool = google_privateca_ca_pool.pool.id
  role = "roles/privateca.auditor"
  members = var.cert_auditors
}
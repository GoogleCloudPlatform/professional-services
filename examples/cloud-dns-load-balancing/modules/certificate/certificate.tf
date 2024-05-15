/**
 * Copyright 2024 Google LLC
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

resource "tls_private_key" "key_example_rsa" {
  algorithm   = "RSA"
  rsa_bits    = "2048"
  # algorithm   = "ECDSA"
  # ecdsa_curve = "P384"
}

resource "tls_cert_request" "cert_example_rsa" {
  # key_algorithm   = "RSA"
  private_key_pem = tls_private_key.key_example_rsa.private_key_pem

  subject {
    common_name  = var.domain
    organization = var.organization_name
  }
}

resource "random_string" "key_suffix" {
  length    = 4
  special   = false
  lower     = true
  upper     = false
}

resource "google_privateca_certificate" "ca-cert-rsa" {
  project   = var.project_id
  location = var.ca_pool_location
  pool = var.ca_pool_name
  lifetime = "860s"
  name = "ca-cert-${random_string.key_suffix.result}"
  pem_csr = tls_cert_request.cert_example_rsa.cert_request_pem
}


resource "google_compute_region_ssl_certificate" "managed-cert" {
  project     = var.project_id
  region      = var.location
  name_prefix = "cert-"
  private_key = tls_private_key.key_example_rsa.private_key_pem
  certificate = google_privateca_certificate.ca-cert-rsa.pem_certificate

  lifecycle {
    create_before_destroy = true
  }
}

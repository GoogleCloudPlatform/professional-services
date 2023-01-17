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

# tfdoc:file:description HTTP and HTTPS target proxies.

locals {
  # Look for the cert in the the ssl_certificates_config map.
  # If not found, use the SSL certificate id as is (already existing).
  ssl_certificates = [
    for cert in try(var.target_proxy_https_config.ssl_certificates, []) :
    try(
      google_compute_region_ssl_certificate.certificates[cert].self_link,
      cert
    )
  ]
}

resource "google_compute_region_target_http_proxy" "http" {
  count       = var.https ? 0 : 1
  name        = var.name
  project     = var.project_id
  description = "Terraform managed."
  region      = var.region
  url_map     = google_compute_region_url_map.url_map.id
}

resource "google_compute_region_target_https_proxy" "https" {
  count            = var.https ? 1 : 0
  name             = var.name
  project          = var.project_id
  description      = "Terraform managed."
  region           = var.region
  url_map          = google_compute_region_url_map.url_map.id
  ssl_certificates = local.ssl_certificates
}

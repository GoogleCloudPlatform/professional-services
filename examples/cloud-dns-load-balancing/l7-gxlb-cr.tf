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

 locals {
   xlb_name = "gxlb-cr"
 }

resource "google_compute_global_address" "xlb-ipv4-ext" {
  name                  = "xlb-ipv4-ext"
  address_type          = "EXTERNAL"
}

resource "google_compute_global_forwarding_rule" "xlb_forwarding_rule" {
  name                  = "${local.xlb_name}"

  ip_address            = google_compute_global_address.xlb-ipv4-ext.address
  target                = google_compute_target_https_proxy.https_proxy.self_link
  port_range            = "443"
}

resource "google_compute_target_https_proxy" "https_proxy" {
  name    = "${local.xlb_name}"
  url_map = google_compute_url_map.url_map.self_link

  ssl_certificates = [
    google_compute_ssl_certificate.managed-cert.id,
  ]
  # E.g. gcloud compute target-https-proxies update test-ilb-cas-https-proxy --region=europe-west3 --ssl-certificates=cert-20220209105621572800000001
  lifecycle {
    ignore_changes = [
      ssl_certificates
    ]
  }
}

resource "google_compute_url_map" "url_map" {
  name            = "${local.xlb_name}"
  default_service = google_compute_backend_service.backend_service.self_link
}

resource "google_compute_backend_service" "backend_service" {
  load_balancing_scheme = "EXTERNAL"
  session_affinity = "NONE"
  
  dynamic backend {
    for_each = var.locations
    content {      
      group        = module.cr-service[backend.key].sneg_id
    }
  }

  name        = "${local.xlb_name}"
  protocol    = "HTTP"
  port_name   = "http" 
  timeout_sec = 30
}

resource "google_compute_health_check" "health_check" {
  name   = "${local.xlb_name}"
  http_health_check {
    port_specification = "USE_SERVING_PORT"
  }
}
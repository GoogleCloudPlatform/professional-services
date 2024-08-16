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

resource "google_compute_forwarding_rule" "forwarding_rule" {
  project    = var.project_id
  
  name       = var.lb_name
  region     = var.location

  ip_protocol           = "TCP"
  load_balancing_scheme = "INTERNAL_MANAGED"
  port_range            = var.lb_port
  target                = google_compute_region_target_https_proxy.https_proxy.self_link
  network               = var.network_id
  subnetwork            = var.subnetwork_id
  network_tier          = "PREMIUM"
  allow_global_access   = true
}

resource "google_compute_region_target_https_proxy" "https_proxy" {
  project  = var.project_id

  region  = var.location
  name    = "${var.lb_name}"
  url_map = google_compute_region_url_map.url_map.self_link

  ssl_certificates = [
    var.certificate_id
  ]
  # E.g. gcloud compute target-https-proxies update test-ilb-cas-https-proxy --region=europe-west3 --ssl-certificates=cert-20220209105621572800000001
  lifecycle {
    ignore_changes = [
      ssl_certificates
    ]
  }
}

resource "google_compute_region_url_map" "url_map" {
  project  = var.project_id

  region          = var.location
  name            = "${var.lb_name}"
  default_service = google_compute_region_backend_service.backend_service.self_link
}

resource "google_compute_region_backend_service" "backend_service" {
  project  = var.project_id

  load_balancing_scheme = "INTERNAL_MANAGED"
  session_affinity = "NONE"
  
  backend {
    group          = var.backend_group_id
    balancing_mode = var.balancing_mode
    capacity_scaler = 1.0
  }

  region      = var.location
  name        = "${var.lb_name}"
  protocol    = var.backend_protocol
  timeout_sec = 30

  // "A backend service cannot have a healthcheck with Serverless network endpoint group backends"
  health_checks = var.is_sneg ? null : [google_compute_region_health_check.health_check.self_link]

  failover_policy {
    drop_traffic_if_unhealthy = true
    failover_ratio = 0.0
    disable_connection_drain_on_failover = false
  }
}

resource "google_compute_region_health_check" "health_check" {
  project    = var.project_id

  region = var.location
  name   = "${var.lb_name}"
  http_health_check {
    port_specification = "USE_SERVING_PORT"
  }
}
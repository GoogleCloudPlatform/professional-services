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

# Hybrid NEG

resource "google_compute_network_endpoint_group" "neg" {
  name                  = var.name
  project               = var.project_id
  network               = var.network
  default_port          = var.dest_port
  zone                  = "${var.region}-${var.zone}"
  network_endpoint_type = "NON_GCP_PRIVATE_IP_PORT"
}

resource "google_compute_network_endpoint" "endpoint" {
  project                = var.project_id
  network_endpoint_group = google_compute_network_endpoint_group.neg.name
  port                   = var.dest_port
  ip_address             = var.dest_ip_address
  zone                   = "${var.region}-${var.zone}"
}

# TCP Proxy ILB

resource "google_compute_region_health_check" "health_check" {
  name               = var.name
  project            = var.project_id
  region             = var.region
  timeout_sec        = 1
  check_interval_sec = 1

  tcp_health_check {
    port = var.dest_port
  }
}

resource "google_compute_region_backend_service" "backend_service" {
  name                  = var.name
  project               = var.project_id
  region                = var.region
  health_checks         = [google_compute_region_health_check.health_check.id]
  load_balancing_scheme = "INTERNAL_MANAGED"
  protocol              = "TCP"

  backend {
    group           = google_compute_network_endpoint_group.neg.self_link
    balancing_mode  = "CONNECTION"
    failover        = false
    capacity_scaler = 1.0
    max_connections = 100
  }
}

resource "google_compute_region_target_tcp_proxy" "target_proxy" {
  provider        = google-beta
  name            = var.name
  region          = var.region
  project         = var.project_id
  backend_service = google_compute_region_backend_service.backend_service.id
}

resource "google_compute_forwarding_rule" "forwarding_rule" {
  provider              = google-beta
  name                  = var.name
  project               = var.project_id
  region                = var.region
  ip_protocol           = "TCP"
  load_balancing_scheme = "INTERNAL_MANAGED"
  port_range            = var.dest_port
  target                = google_compute_region_target_tcp_proxy.target_proxy.id
  network               = var.network
  subnetwork            = var.subnet
  network_tier          = "PREMIUM"
}

# PSC Service Attachment

resource "google_compute_service_attachment" "service_attachment" {
  name                  = var.name
  project               = var.project_id
  region                = var.region
  enable_proxy_protocol = false
  connection_preference = "ACCEPT_MANUAL"
  nat_subnets           = var.subnets_psc
  target_service        = google_compute_forwarding_rule.forwarding_rule.id

  dynamic "consumer_accept_lists" {
    for_each = var.accepted_limits
    content {
      project_id_or_num = consumer_accept_lists.key
      connection_limit  = consumer_accept_lists.value
    }
  }
}

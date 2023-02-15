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

resource "google_compute_address" "api" {
  project      = var.service_project.project_id
  name         = "${local.infra_id}-ilb"
  address_type = "INTERNAL"
  region       = var.region
  subnetwork   = data.google_compute_subnetwork.default["default"].self_link
}

resource "google_compute_health_check" "api" {
  project = var.service_project.project_id
  name    = "${local.infra_id}-api"
  https_health_check {
    port         = 6443
    request_path = "/readyz"
  }
}

resource "google_compute_region_backend_service" "api" {
  project               = var.service_project.project_id
  name                  = "${local.infra_id}-api"
  load_balancing_scheme = "INTERNAL"
  region                = var.region
  network               = data.google_compute_network.default.self_link
  health_checks         = [google_compute_health_check.api.self_link]
  protocol              = "TCP"
  dynamic "backend" {
    for_each = google_compute_instance_group.master
    content {
      group = backend.value.self_link
    }
  }
  dynamic "backend" {
    for_each = toset(local.bootstrapping ? [""] : [])
    content {
      group = google_compute_instance_group.bootstrap.self_link
    }
  }
}

resource "google_compute_forwarding_rule" "api" {
  project               = var.service_project.project_id
  name                  = "${local.infra_id}-api"
  load_balancing_scheme = "INTERNAL"
  region                = var.region
  network               = data.google_compute_network.default.self_link
  subnetwork            = data.google_compute_subnetwork.default["default"].self_link
  ip_address            = google_compute_address.api.address
  ip_protocol           = "TCP"
  ports                 = [6443, 22623]
  allow_global_access   = true
  backend_service       = google_compute_region_backend_service.api.self_link
}

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

resource "google_compute_global_forwarding_rule" "forwarding_rule" {
  for_each              = var.subnetwork_ids
  project               = var.project_id
  
  name                  = "${var.lb_name}-${each.key}"

  ip_protocol           = "TCP"
  load_balancing_scheme = "INTERNAL_MANAGED"
  port_range            = var.lb_port
  target                = google_compute_target_https_proxy.https_proxy.self_link
  network               = var.network_id
  subnetwork            = each.value
}

resource "google_compute_target_https_proxy" "https_proxy" {
  project  = var.project_id

  name    = "${var.lb_name}"
  url_map = google_compute_url_map.url_map.self_link

  certificate_manager_certificates = [
    var.certificate_id
  ]
  lifecycle {
    ignore_changes = [
      certificate_manager_certificates
    ]
  }
}

resource "google_compute_url_map" "url_map" {
  project  = var.project_id

  name            = "${var.lb_name}"
  default_service = google_compute_backend_service.backend_service.self_link
}

resource "google_compute_backend_service" "backend_service" {
  project  = var.project_id

  load_balancing_scheme = "INTERNAL_MANAGED"
  session_affinity = "NONE"
  
  dynamic "backend" {
    for_each          = var.backend_group_ids
    content {
      group           = backend.value
      balancing_mode  = var.balancing_mode
      capacity_scaler = 1.0      
    }
  }

  name        = "${var.lb_name}"
  protocol    = var.backend_protocol
  timeout_sec = 30

  // "A backend service cannot have a healthcheck with Serverless network endpoint group backends"
  health_checks = var.is_sneg ? null : [google_compute_health_check.health_check.self_link]

  outlier_detection {
    base_ejection_time {
      nanos     = 0
      seconds   = 1
    }
    consecutive_errors = 3
    enforcing_consecutive_errors = 100
    interval {
      nanos     = 0
      seconds   = 1
    }
    max_ejection_percent = 50

    # The following settings are not supported by the Serverless NEGs
    enforcing_success_rate        =  var.is_sneg ? 0 : 100
    success_rate_minimum_hosts    =  var.is_sneg ? 0 : 5
    success_rate_request_volume   =  var.is_sneg ? 0 : 100
    success_rate_stdev_factor     =  var.is_sneg ? 0 : 1900
  }

}

resource "google_compute_health_check" "health_check" {
  project    = var.project_id

  name   = "${var.lb_name}"
  http_health_check {
    port_specification = "USE_SERVING_PORT"
  }
}
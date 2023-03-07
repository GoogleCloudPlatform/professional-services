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


locals {
  bs_conntrack = var.backend_service_config.connection_tracking
  bs_failover  = var.backend_service_config.failover_config
  health_check = (
    var.health_check != null
    ? var.health_check
    : google_compute_health_check.default.0.self_link
  )
}

resource "google_compute_forwarding_rule" "default" {
  provider    = google-beta
  project     = var.project_id
  region      = var.region
  name        = var.name
  description = var.description
  ip_address  = var.address
  ip_protocol = var.protocol # TCP | UDP
  backend_service = (
    google_compute_region_backend_service.default.self_link
  )
  load_balancing_scheme = "INTERNAL"
  network               = var.vpc_config.network
  ports                 = var.ports # "nnnnn" or "nnnnn,nnnnn,nnnnn" max 5
  subnetwork            = var.vpc_config.subnetwork
  allow_global_access   = var.global_access
  labels                = var.labels
  all_ports             = var.ports == null ? true : null
  service_label         = var.service_label
  # is_mirroring_collector = false
}

resource "google_compute_region_backend_service" "default" {
  provider                        = google-beta
  project                         = var.project_id
  region                          = var.region
  name                            = var.name
  description                     = var.description
  load_balancing_scheme           = "INTERNAL"
  protocol                        = var.protocol
  network                         = var.vpc_config.network
  health_checks                   = [local.health_check]
  connection_draining_timeout_sec = var.backend_service_config.connection_draining_timeout_sec
  session_affinity                = var.backend_service_config.session_affinity
  timeout_sec                     = var.backend_service_config.timeout_sec

  dynamic "backend" {
    for_each = { for b in var.backends : b.group => b }
    content {
      balancing_mode = backend.value.balancing_mode
      description    = backend.value.description
      failover       = backend.value.failover
      group          = backend.key
    }
  }

  dynamic "connection_tracking_policy" {
    for_each = local.bs_conntrack == null ? [] : [""]
    content {
      connection_persistence_on_unhealthy_backends = (
        local.bs_conntrack.persist_conn_on_unhealthy != null
        ? local.bs_conntrack.persist_conn_on_unhealthy
        : null
      )
      idle_timeout_sec = local.bs_conntrack.idle_timeout_sec
      tracking_mode = (
        local.bs_conntrack.track_per_session != null
        ? local.bs_conntrack.track_per_session
        : null
      )
    }
  }

  dynamic "failover_policy" {
    for_each = local.bs_failover == null ? [] : [""]
    content {
      disable_connection_drain_on_failover = local.bs_failover.disable_conn_drain
      drop_traffic_if_unhealthy            = local.bs_failover.drop_traffic_if_unhealthy
      failover_ratio                       = local.bs_failover.ratio
    }
  }

  dynamic "log_config" {
    for_each = var.backend_service_config.log_sample_rate == null ? [] : [""]
    content {
      enable      = true
      sample_rate = var.backend_service_config.log_sample_rate
    }
  }

  dynamic "subsetting" {
    for_each = var.backend_service_config.enable_subsetting == true ? [""] : []
    content {
      policy = "CONSISTENT_HASH_SUBSETTING"
    }
  }

}

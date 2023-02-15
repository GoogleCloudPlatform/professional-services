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

# tfdoc:file:description Bucket and group backend services.

resource "google_compute_region_backend_service" "backend_service" {
  for_each                        = var.backend_services_config
  name                            = "${var.name}-${each.key}"
  project                         = var.project_id
  description                     = "Terraform managed."
  affinity_cookie_ttl_sec         = try(each.value.options.affinity_cookie_ttl_sec, null)
  connection_draining_timeout_sec = try(each.value.options.connection_draining_timeout_sec, null)
  load_balancing_scheme           = "INTERNAL_MANAGED"
  locality_lb_policy              = try(each.value.options.locality_lb_policy, null)
  port_name                       = try(each.value.options.port_name, null)
  protocol                        = try(each.value.options.protocol, null)
  region                          = var.region
  session_affinity                = try(each.value.options.session_affinity, null)
  timeout_sec                     = try(each.value.options.timeout_sec, null)

  # If no health checks are defined, use the default one.
  # Otherwise, look in the health_checks_config map.
  # Otherwise, use the health_check id as is (already existing).
  health_checks = (
    try(length(each.value.health_checks), 0) == 0
    ? try(
      [google_compute_region_health_check.health_check["default"].self_link],
      null
    )
    : [
      for hc in each.value.health_checks :
      try(google_compute_region_health_check.health_check[hc].self_link, hc)
    ]
  )

  dynamic "backend" {
    for_each = try(each.value.backends, [])
    content {
      balancing_mode               = try(backend.value.options.balancing_mode, "UTILIZATION")
      capacity_scaler              = try(backend.value.options.capacity_scaler, 1.0)
      group                        = try(backend.value.group, null)
      max_connections              = try(backend.value.options.max_connections, null)
      max_connections_per_instance = try(backend.value.options.max_connections_per_instance, null)
      max_connections_per_endpoint = try(backend.value.options.max_connections_per_endpoint, null)
      max_rate                     = try(backend.value.options.max_rate, null)
      max_rate_per_instance        = try(backend.value.options.max_rate_per_instance, null)
      max_rate_per_endpoint        = try(backend.value.options.max_rate_per_endpoint, null)
      max_utilization              = try(backend.value.options.max_utilization, null)
    }
  }

  dynamic "circuit_breakers" {
    for_each = (
      try(each.value.options.circuit_breakers, null) == null
      ? []
      : [each.value.options.circuit_breakers]
    )
    iterator = cb
    content {
      max_requests_per_connection = try(cb.value.max_requests_per_connection, null)
      max_connections             = try(cb.value.max_connections, null)
      max_pending_requests        = try(cb.value.max_pending_requests, null)
      max_requests                = try(cb.value.max_requests, null)
      max_retries                 = try(cb.value.max_retries, null)
    }
  }

  dynamic "consistent_hash" {
    for_each = (
      try(each.value.options.consistent_hash, null) == null
      ? []
      : [each.value.options.consistent_hash]
    )
    content {
      http_header_name  = try(consistent_hash.value.http_header_name, null)
      minimum_ring_size = try(consistent_hash.value.minimum_ring_size, null)

      dynamic "http_cookie" {
        for_each = try(consistent_hash.value.http_cookie, null) == null ? [] : [consistent_hash.value.http_cookie]
        content {
          name = try(http_cookie.value.name, null)
          path = try(http_cookie.value.path, null)

          dynamic "ttl" {
            for_each = try(consistent_hash.value.ttl, null) == null ? [] : [consistent_hash.value.ttl]
            content {
              seconds = try(ttl.value.seconds, null) # Must be from 0 to 315,576,000,000 inclusive
              nanos   = try(ttl.value.nanos, null)   # Must be from 0 to 999,999,999 inclusive
            }
          }
        }
      }
    }
  }

  dynamic "iap" {
    for_each = (
      try(each.value.options.iap, null) == null
      ? []
      : [each.value.options.iap]
    )
    content {
      oauth2_client_id            = try(iap.value.oauth2_client_id, null)
      oauth2_client_secret        = try(iap.value.oauth2_client_secret, null)        # sensitive
      oauth2_client_secret_sha256 = try(iap.value.oauth2_client_secret_sha256, null) # sensitive
    }
  }

  dynamic "log_config" {
    for_each = (
      try(each.value.log_config, null) == null
      ? []
      : [each.value.log_config]
    )
    content {
      enable      = try(log_config.value.enable, null)
      sample_rate = try(log_config.value.sample_rate, null)
    }
  }
}

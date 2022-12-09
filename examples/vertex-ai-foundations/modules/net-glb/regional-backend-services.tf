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

# tfdoc:file:description Bucket and group backend services for regional load balancers.

resource "google_compute_region_backend_service" "group" {
  for_each                        = var.region != null ? local.backend_services_group : {}
  name                            = "${var.name}-${each.key}"
  project                         = var.project_id
  region                          = var.region
  description                     = "Terraform managed."
  affinity_cookie_ttl_sec         = try(each.value.group_config.options.affinity_cookie_ttl_sec, null)
  enable_cdn                      = try(each.value.enable_cdn, null)
  connection_draining_timeout_sec = try(each.value.group_config.options.connection_draining_timeout_sec, null)
  load_balancing_scheme           = try(each.value.group_config.options.load_balancing_scheme, null)
  locality_lb_policy              = try(each.value.group_config.options.locality_lb_policy, null)
  port_name                       = try(each.value.group_config.options.port_name, null)
  protocol                        = try(each.value.group_config.options.protocol, null)
  session_affinity                = try(each.value.group_config.options.session_affinity, null)
  timeout_sec                     = try(each.value.group_config.options.timeout_sec, null)

  # If no health checks are defined, use the default one.
  # Otherwise, look in the health_checks_config map.
  # Otherwise, use the health_check id as is (already existing).
  health_checks = (
    try(length(each.value.group_config.health_checks), 0) == 0
    ? try(
      [google_compute_region_health_check.health_check["default"].id],
      null
    )
    : [
      for hc in each.value.group_config.health_checks :
      try(google_compute_region_health_check.health_check[hc].id, hc)
    ]
  )

  dynamic "backend" {
    for_each = try(each.value.group_config.backends, [])
    content {
      balancing_mode               = try(backend.value.options.balancing_mode, null)
      capacity_scaler              = try(backend.value.options.capacity_scaler, null)
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
      try(each.value.group_config.options.circuit_breakers, null) == null
      ? []
      : [each.value.group_config.options.circuit_breakers]
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
      try(each.value.group_config.options.consistent_hash, null) == null
      ? []
      : [each.value.group_config.options.consistent_hash]
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

  dynamic "cdn_policy" {
    for_each = (
      try(each.value.cdn_policy, null) == null
      ? []
      : [each.value.cdn_policy]
    )
    iterator = cdn_policy
    content {
      signed_url_cache_max_age_sec = try(cdn_policy.value.signed_url_cache_max_age_sec, null)
      default_ttl                  = try(cdn_policy.value.default_ttl, null)
      max_ttl                      = try(cdn_policy.value.max_ttl, null)
      client_ttl                   = try(cdn_policy.value.client_ttl, null)
      negative_caching             = try(cdn_policy.value.negative_caching, null)
      cache_mode                   = try(cdn_policy.value.cache_mode, null)
      serve_while_stale            = try(cdn_policy.value.serve_while_stale, null)

      dynamic "negative_caching_policy" {
        for_each = (
          try(cdn_policy.value.negative_caching_policy, null) == null
          ? []
          : [cdn_policy.value.negative_caching_policy]
        )
        iterator = ncp
        content {
          code = try(ncp.value.code, null)
        }
      }
    }
  }

  dynamic "iap" {
    for_each = (
      try(each.value.group_config.options.iap, null) == null
      ? []
      : [each.value.group_config.options.iap]
    )
    content {
      oauth2_client_id            = try(iap.value.oauth2_client_id, null)
      oauth2_client_secret        = try(iap.value.oauth2_client_secret, null)        # sensitive
      oauth2_client_secret_sha256 = try(iap.value.oauth2_client_secret_sha256, null) # sensitive
    }
  }

  dynamic "log_config" {
    for_each = (
      try(each.value.group_config.log_config, null) == null
      ? []
      : [each.value.group_config.log_config]
    )
    content {
      enable      = try(log_config.value.enable, null)
      sample_rate = try(log_config.value.sample_rate, null)
    }
  }
}

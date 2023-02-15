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

# tfdoc:file:description Health checks.

locals {
  # Get backend services without health checks defined
  _backends_without_hcs = [
    for k, v in coalesce(var.backend_services_config, {}) :
    v if(
      try(v.health_checks, null) == null
      || length(try(v.health_checks, [])) == 0
    )
  ]

  health_checks_config_defaults = (
    try(var.health_checks_config_defaults, null) == null
    ? null
    : { default = var.health_checks_config_defaults }
  )

  # If at least one group backend service without HC is defined,
  # create also a default HC (if default HC is not null)
  health_checks_config = (
    length(local._backends_without_hcs) > 0
    ? merge(
      coalesce(local.health_checks_config_defaults, {}),
      coalesce(var.health_checks_config, {})
    )
    : coalesce(var.health_checks_config, {})
  )
}

resource "google_compute_region_health_check" "health_check" {
  for_each            = local.health_checks_config
  provider            = google-beta
  name                = "${var.name}-${each.key}"
  project             = var.project_id
  description         = "Terraform managed."
  check_interval_sec  = try(each.value.options.check_interval_sec, null)
  healthy_threshold   = try(each.value.options.healthy_threshold, null)
  region              = var.region
  timeout_sec         = try(each.value.options.timeout_sec, null)
  unhealthy_threshold = try(each.value.options.unhealthy_threshold, null)

  dynamic "http_health_check" {
    for_each = (
      try(each.value.type, null) == "http" || try(each.value.type, null) == null
      ? { 1 = 1 }
      : {}
    )
    content {
      host               = try(each.value.check.host, null)
      port               = try(each.value.check.port, null)
      port_name          = try(each.value.check.port_name, null)
      port_specification = try(each.value.check.port_specification, null)
      proxy_header       = try(each.value.check.proxy_header, null)
      request_path       = try(each.value.check.request_path, null)
      response           = try(each.value.check.response, null)
    }
  }

  dynamic "https_health_check" {
    for_each = (
      try(each.value.type, null) == "https" || try(each.value.type, null) == null
      ? { 1 = 1 }
      : {}
    )
    content {
      host               = try(each.value.check.host, null)
      port               = try(each.value.check.port, null)
      port_name          = try(each.value.check.port_name, null)
      port_specification = try(each.value.check.port_specification, null)
      proxy_header       = try(each.value.check.proxy_header, null)
      request_path       = try(each.value.check.request_path, null)
      response           = try(each.value.check.response, null)
    }
  }

  dynamic "tcp_health_check" {
    for_each = (
      try(each.value.type, null) == "tcp" || try(each.value.type, null) == null
      ? { 1 = 1 }
      : {}
    )
    content {
      port               = try(each.value.check.port, null)
      port_name          = try(each.value.check.port_name, null)
      port_specification = try(each.value.check.port_specification, null)
      proxy_header       = try(each.value.check.proxy_header, null)
      request            = try(each.value.check.request, null)
      response           = try(each.value.check.response, null)
    }
  }

  dynamic "ssl_health_check" {
    for_each = (
      try(each.value.type, null) == "ssl" || try(each.value.type, null) == null
      ? { 1 = 1 }
      : {}
    )
    content {
      port               = try(each.value.check.port, null)
      port_name          = try(each.value.check.port_name, null)
      port_specification = try(each.value.check.port_specification, null)
      proxy_header       = try(each.value.check.proxy_header, null)
      request            = try(each.value.check.request, null)
      response           = try(each.value.check.response, null)
    }
  }

  dynamic "http2_health_check" {
    for_each = (
      try(each.value.type, null) == "http2" || try(each.value.type, null) == null
      ? { 1 = 1 }
      : {}
    )
    content {
      host               = try(each.value.check.host, null)
      port               = try(each.value.check.port, null)
      port_name          = try(each.value.check.port_name, null)
      port_specification = try(each.value.check.port_specification, null)
      proxy_header       = try(each.value.check.proxy_header, null)
      request_path       = try(each.value.check.request_path, null)
      response           = try(each.value.check.response, null)
    }
  }

  dynamic "log_config" {
    for_each = try(each.value.logging, false) ? { 0 = 0 } : {}
    content {
      enable = true
    }
  }
}

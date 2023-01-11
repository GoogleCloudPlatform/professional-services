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

# tfdoc:file:description Health check resource.

locals {
  hc       = var.health_check_config
  hc_grpc  = try(local.hc.grpc, null) != null
  hc_http  = try(local.hc.http, null) != null
  hc_http2 = try(local.hc.http2, null) != null
  hc_https = try(local.hc.https, null) != null
  hc_ssl   = try(local.hc.ssl, null) != null
  hc_tcp   = try(local.hc.tcp, null) != null
}

resource "google_compute_health_check" "default" {
  provider            = google-beta
  count               = local.hc != null ? 1 : 0
  project             = var.project_id
  name                = var.name
  description         = local.hc.description
  check_interval_sec  = local.hc.check_interval_sec
  healthy_threshold   = local.hc.healthy_threshold
  timeout_sec         = local.hc.timeout_sec
  unhealthy_threshold = local.hc.unhealthy_threshold

  dynamic "grpc_health_check" {
    for_each = local.hc_grpc ? [""] : []
    content {
      port               = local.hc.grpc.port
      port_name          = local.hc.grpc.port_name
      port_specification = local.hc.grpc.port_specification
      grpc_service_name  = local.hc.grpc.service_name
    }
  }

  dynamic "http_health_check" {
    for_each = local.hc_http ? [""] : []
    content {
      host               = local.hc.http.host
      port               = local.hc.http.port
      port_name          = local.hc.http.port_name
      port_specification = local.hc.http.port_specification
      proxy_header       = local.hc.http.proxy_header
      request_path       = local.hc.http.request_path
      response           = local.hc.http.response
    }
  }

  dynamic "http2_health_check" {
    for_each = local.hc_http2 ? [""] : []
    content {
      host               = local.hc.http.host
      port               = local.hc.http.port
      port_name          = local.hc.http.port_name
      port_specification = local.hc.http.port_specification
      proxy_header       = local.hc.http.proxy_header
      request_path       = local.hc.http.request_path
      response           = local.hc.http.response
    }
  }

  dynamic "https_health_check" {
    for_each = local.hc_https ? [""] : []
    content {
      host               = local.hc.http.host
      port               = local.hc.http.port
      port_name          = local.hc.http.port_name
      port_specification = local.hc.http.port_specification
      proxy_header       = local.hc.http.proxy_header
      request_path       = local.hc.http.request_path
      response           = local.hc.http.response
    }
  }

  dynamic "ssl_health_check" {
    for_each = local.hc_ssl ? [""] : []
    content {
      port               = local.hc.tcp.port
      port_name          = local.hc.tcp.port_name
      port_specification = local.hc.tcp.port_specification
      proxy_header       = local.hc.tcp.proxy_header
      request            = local.hc.tcp.request
      response           = local.hc.tcp.response
    }
  }

  dynamic "tcp_health_check" {
    for_each = local.hc_tcp ? [""] : []
    content {
      port               = local.hc.tcp.port
      port_name          = local.hc.tcp.port_name
      port_specification = local.hc.tcp.port_specification
      proxy_header       = local.hc.tcp.proxy_header
      request            = local.hc.tcp.request
      response           = local.hc.tcp.response
    }
  }

  dynamic "log_config" {
    for_each = try(local.hc.enable_logging, null) == true ? [""] : []
    content {
      enable = true
    }
  }
}

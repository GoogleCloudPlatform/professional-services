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

variable "name" {
  description = "Load balancer name."
  type        = string
}

variable "project_id" {
  description = "Project id."
  type        = string
}

variable "region" {
  description = "Create a regional load balancer in this region."
  type        = string
  default     = null
}

variable "health_checks_config_defaults" {
  description = "Auto-created health check default configuration."
  type = object({
    type    = string      # http https tcp ssl http2
    check   = map(any)    # actual health check block attributes
    options = map(number) # interval, thresholds, timeout
    logging = bool
  })
  default = {
    type    = "http"
    logging = false
    options = {}
    check = {
      port_specification = "USE_SERVING_PORT"
    }
  }
}

variable "health_checks_config" {
  description = "Custom health checks configuration."
  type = map(object({
    type    = string      # http https tcp ssl http2
    check   = map(any)    # actual health check block attributes
    options = map(number) # interval, thresholds, timeout
    logging = bool
  }))
  default = {}
}

variable "backend_services_config" {
  description = "The backends services configuration."
  type = map(object({
    enable_cdn = bool

    cdn_config = object({
      cache_mode                   = string
      client_ttl                   = number
      default_ttl                  = number
      max_ttl                      = number
      negative_caching             = bool
      negative_caching_policy      = map(number)
      serve_while_stale            = bool
      signed_url_cache_max_age_sec = string
    })

    bucket_config = object({
      bucket_name = string
      options = object({
        custom_response_headers = list(string)
      })
    })

    group_config = object({
      backends = list(object({
        group = string # IG or NEG FQDN address
        options = object({
          balancing_mode               = string # Can be UTILIZATION, RATE, CONNECTION
          capacity_scaler              = number # Valid range is [0.0,1.0]
          max_connections              = number
          max_connections_per_instance = number
          max_connections_per_endpoint = number
          max_rate                     = number
          max_rate_per_instance        = number
          max_rate_per_endpoint        = number
          max_utilization              = number
        })
      }))

      # Optional health check ids for backend service groups.
      # Will lookup for ids in health_chacks_config first,
      # then will use the id as is. If no ids are defined
      # at all (null, []) health_checks_config_defaults is used
      health_checks = list(string)

      log_config = object({
        enable      = bool
        sample_rate = number # must be in [0, 1]
      })

      options = object({
        affinity_cookie_ttl_sec         = number
        custom_request_headers          = list(string)
        custom_response_headers         = list(string)
        connection_draining_timeout_sec = number
        load_balancing_scheme           = string # only EXTERNAL (default) makes sense here
        locality_lb_policy              = string
        port_name                       = string
        protocol                        = string
        security_policy                 = string
        session_affinity                = string
        timeout_sec                     = number

        circuits_breakers = object({
          max_requests_per_connection = number # Set to 1 to disable keep-alive
          max_connections             = number # Defaults to 1024
          max_pending_requests        = number # Defaults to 1024
          max_requests                = number # Defaults to 1024
          max_retries                 = number # Defaults to 3
        })

        consistent_hash = object({
          http_header_name  = string
          minimum_ring_size = string
          http_cookie = object({
            name = string
            path = string
            ttl = object({
              seconds = number
              nanos   = number
            })
          })
        })

        iap = object({
          oauth2_client_id            = string
          oauth2_client_secret        = string
          oauth2_client_secret_sha256 = string
        })
      })
    })
  }))
  default = {}
}

variable "url_map_config" {
  description = "The url-map configuration."
  type = object({
    default_service      = string
    default_route_action = any
    default_url_redirect = map(any)
    header_action        = any
    host_rules           = list(any)
    path_matchers        = list(any)
    tests                = list(map(string))
  })
  default = null
}

variable "ssl_certificates_config" {
  description = "The SSL certificate configuration."
  type = map(object({
    domains = list(string)
    # If unmanaged_config is null, the certificate will be managed
    unmanaged_config = object({
      tls_private_key      = string
      tls_self_signed_cert = string
    })
  }))
  default = {}
}

variable "ssl_certificates_config_defaults" {
  description = "The SSL certificate default configuration."
  type = object({
    domains = list(string)
    # If unmanaged_config is null, the certificate will be managed
    unmanaged_config = object({
      tls_private_key      = string
      tls_self_signed_cert = string
    })
  })
  default = {
    domains          = ["example.com"],
    unmanaged_config = null
  }
}

variable "target_proxy_https_config" {
  description = "The HTTPS target proxy configuration."
  type = object({
    ssl_certificates = list(string)
  })
  default = null
}

variable "global_forwarding_rule_config" {
  description = "Global forwarding rule configurations."
  type = object({
    ip_protocol           = string
    ip_version            = string
    load_balancing_scheme = string
    port_range            = string

  })
  default = {
    load_balancing_scheme = "EXTERNAL"
    ip_protocol           = "TCP"
    ip_version            = "IPV4"
    # If not specified, 80 for https = false, 443 otherwise
    port_range = null
  }
}

variable "forwarding_rule_config" {
  description = "Regional forwarding rule configurations."
  type = object({
    ip_protocol           = string
    ip_version            = string
    load_balancing_scheme = string
    port_range            = string
    network_tier          = string
    network               = string
  })
  default = {
    load_balancing_scheme = "EXTERNAL_MANAGED"
    ip_protocol           = "TCP"
    ip_version            = "IPV4"
    network_tier          = "STANDARD"
    network               = "default"
    # If not specified, 80 for https = false, 443 otherwise
    port_range = null
  }
}

variable "https" {
  description = "Whether to enable HTTPS."
  type        = bool
  default     = false
}

variable "reserve_ip_address" {
  description = "Whether to reserve a static global IP address."
  type        = bool
  default     = false
}

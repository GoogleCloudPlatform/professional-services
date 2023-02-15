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

variable "backend_services_config" {
  description = "The backends services configuration."
  type = map(object({
    backends = list(object({
      group = string # The instance group link id
      options = object({
        balancing_mode               = string # Can be UTILIZATION, RATE
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
      locality_lb_policy              = string
      port_name                       = string
      protocol                        = string
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
  }))
  default = {}
}

variable "forwarding_rule_config" {
  description = "Forwarding rule configurations."
  type = object({
    ip_version    = string
    labels        = map(string)
    network_tier  = string
    port_range    = string
    service_label = string
  })
  default = {
    allow_global_access = true
    ip_version          = "IPV4"
    labels              = {}
    network_tier        = "PREMIUM"
    # If not specified, 443 if var.https = true; 80 otherwise
    port_range    = null
    service_label = null
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

variable "health_checks_config_defaults" {
  description = "Auto-created health check default configuration."
  type = object({
    check   = map(any) # actual health check block attributes
    logging = bool
    options = map(number) # interval, thresholds, timeout
    type    = string      # http https tcp ssl http2
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

variable "https" {
  description = "Whether to enable HTTPS."
  type        = bool
  default     = false
}

variable "network" {
  description = "The network where the ILB is created."
  type        = string
  default     = "default"
}

variable "region" {
  description = "The region where to allocate the ILB resources."
  type        = string
}

variable "ssl_certificates_config" {
  description = "The SSL certificates configuration."
  type = map(object({
    domains              = list(string)
    tls_private_key      = string
    tls_self_signed_cert = string
  }))
  default = {}
}

variable "static_ip_config" {
  description = "Static IP address configuration."
  type = object({
    reserve = bool
    options = object({
      address    = string
      subnetwork = string # The subnet id
    })
  })
  default = {
    reserve = false
    options = null
  }
}

variable "subnetwork" {
  description = "The subnetwork where the ILB VIP is allocated."
  type        = string
}

variable "target_proxy_https_config" {
  description = "The HTTPS target proxy configuration."
  type = object({
    ssl_certificates = list(string)
  })
  default = null
}

variable "url_map_config" {
  description = "The url-map configuration."
  type = object({
    default_service      = string
    default_url_redirect = map(any)
    host_rules           = list(any)
    path_matchers        = list(any)
    tests                = list(map(string))
  })
  default = null
}

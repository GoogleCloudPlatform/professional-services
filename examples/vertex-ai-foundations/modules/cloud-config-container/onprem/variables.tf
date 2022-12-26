/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

variable "config_variables" {
  description = "Additional variables used to render the cloud-config and CoreDNS templates."
  type        = map(any)
  default     = {}
}

variable "coredns_config" {
  description = "CoreDNS configuration path, if null default will be used."
  type        = string
  default     = null
}

variable "local_ip_cidr_range" {
  description = "IP CIDR range used for the Docker onprem network."
  type        = string
  default     = "192.168.192.0/24"
}

variable "vpn_config" {
  description = "VPN configuration, type must be one of 'dynamic' or 'static'."
  type = object({
    peer_ip        = string
    shared_secret  = string
    type           = string
    peer_ip2       = string
    shared_secret2 = string
  })
}

variable "vpn_dynamic_config" {
  description = "BGP configuration for dynamic VPN, ignored if VPN type is 'static'."
  type = object({
    local_bgp_asn      = number
    local_bgp_address  = string
    peer_bgp_asn       = number
    peer_bgp_address   = string
    local_bgp_asn2     = number
    local_bgp_address2 = string
    peer_bgp_asn2      = number
    peer_bgp_address2  = string
  })
  default = {
    local_bgp_asn      = 64514
    local_bgp_address  = "169.254.1.2"
    peer_bgp_asn       = 64513
    peer_bgp_address   = "169.254.1.1"
    local_bgp_asn2     = 64514
    local_bgp_address2 = "169.254.2.2"
    peer_bgp_asn2      = 64520
    peer_bgp_address2  = "169.254.2.1"
  }
}

variable "vpn_static_ranges" {
  description = "Remote CIDR ranges for static VPN, ignored if VPN type is 'dynamic'."
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

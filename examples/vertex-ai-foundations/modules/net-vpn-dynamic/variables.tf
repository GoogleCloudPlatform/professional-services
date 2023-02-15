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

variable "gateway_address" {
  description = "Optional address assigned to the VPN gateway. Ignored unless gateway_address_create is set to false."
  type        = string
  default     = ""
}

variable "gateway_address_create" {
  description = "Create external address assigned to the VPN gateway. Needs to be explicitly set to false to use address in gateway_address variable."
  type        = bool
  default     = true
}

variable "name" {
  description = "VPN gateway name, and prefix used for dependent resources."
  type        = string
}

variable "network" {
  description = "VPC used for the gateway and routes."
  type        = string
}

variable "project_id" {
  description = "Project where resources will be created."
  type        = string
}

variable "region" {
  description = "Region used for resources."
  type        = string
}

variable "route_priority" {
  description = "Route priority, defaults to 1000."
  type        = number
  default     = 1000
}

variable "router_advertise_config" {
  description = "Router custom advertisement configuration, ip_ranges is a map of address ranges and descriptions."
  type = object({
    groups    = list(string)
    ip_ranges = map(string)
    mode      = string
  })
  default = null
}

variable "router_asn" {
  description = "Router ASN used for auto-created router."
  type        = number
  default     = 64514
}

variable "router_create" {
  description = "Create router."
  type        = bool
  default     = true
}

variable "router_name" {
  description = "Router name used for auto created router, or to specify existing router to use. Leave blank to use VPN name for auto created router."
  type        = string
  default     = ""
}

variable "tunnels" {
  description = "VPN tunnel configurations, bgp_peer_options is usually null."
  type = map(object({
    bgp_peer = object({
      address = string
      asn     = number
    })
    bgp_peer_options = object({
      advertise_groups    = list(string)
      advertise_ip_ranges = map(string)
      advertise_mode      = string
      route_priority      = number
    })
    # each BGP session on the same Cloud Router must use a unique /30 CIDR
    # from the 169.254.0.0/16 block.
    bgp_session_range = string
    ike_version       = number
    peer_ip           = string
    router            = string
    shared_secret     = string
  }))
  default = {}
}

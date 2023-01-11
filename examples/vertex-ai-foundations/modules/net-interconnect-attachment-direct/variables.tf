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

variable "bgp" {
  description = "Bgp session parameters."
  type = object({
    session_range             = string
    candidate_ip_ranges       = list(string)
    advertised_route_priority = number

  })
  default = null
}

variable "config" {
  description = "VLAN attachment parameters: description, vlan_id, bandwidth, admin_enabled, interconnect."
  type = object({
    description   = string
    vlan_id       = number
    bandwidth     = string
    admin_enabled = bool
    mtu           = number
  })
  default = {
    description   = null
    vlan_id       = null
    bandwidth     = "BPS_10G"
    admin_enabled = true
    mtu           = 1440
  }
}

variable "interconnect" {
  description = "URL of the underlying Interconnect object that this attachment's traffic will traverse through."
  type        = string
}

variable "name" {
  description = "The name of the vlan attachment."
  type        = string
  default     = "vlan-attachment"
}

variable "peer" {
  description = "Peer Ip address and asn. Only IPv4 supported."
  type = object({
    ip_address = string
    asn        = number
  })
}

variable "project_id" {
  description = "The project containing the resources."
  type        = string
}

variable "region" {
  description = "Region where the router resides."
  type        = string
  default     = "europe-west1-b"
}

variable "router_config" {
  description = "Router asn and custom advertisement configuration, ip_ranges is a map of address ranges and descriptions.. ."
  type = object({
    description = string
    asn         = number
    advertise_config = object({
      groups    = list(string)
      ip_ranges = map(string)
      mode      = string
    })
  })

  default = {
    description      = null
    asn              = 64514
    advertise_config = null
  }
}

variable "router_create" {
  description = "Create router."
  type        = bool
  default     = true
}

variable "router_name" {
  description = "Router name used for auto created router, or to specify an existing router to use if `router_create` is set to `true`. Leave blank to use vlan attachment name for auto created router."
  type        = string
  default     = "router-vlan-attachment"
}

variable "router_network" {
  description = "A reference to the network to which this router belongs."
  type        = string
  default     = null
}





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

variable "remote_ranges" {
  description = "Remote IP CIDR ranges."
  type        = list(string)
  default     = []
}

variable "route_priority" {
  description = "Route priority, defaults to 1000."
  type        = number
  default     = 1000
}

variable "tunnels" {
  description = "VPN tunnel configurations."
  type = map(object({
    ike_version   = number
    peer_ip       = string
    shared_secret = string
    traffic_selectors = object({
      local  = list(string)
      remote = list(string)
    })
  }))
  default = {}
}

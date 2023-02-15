# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

variable "ip_ranges" {
  description = "Subnet IP CIDR ranges."
  type        = map(string)
  default = {
    land-0-r1 = "10.0.0.0/24"
    land-0-r2 = "10.0.8.0/24"
    dev-0-r1  = "10.0.16.0/24"
    dev-0-r2  = "10.0.24.0/24"
    prod-0-r1 = "10.0.32.0/24"
    prod-0-r2 = "10.0.40.0/24"
  }
}

variable "ip_secondary_ranges" {
  description = "Subnet secondary ranges."
  type        = map(map(string))
  default     = {}
}

variable "prefix" {
  description = "Prefix used in resource names."
  type        = string
  default     = null
}

variable "project_create_config" {
  description = "Populate with billing account id to trigger project creation."
  type = object({
    billing_account_id = string
    parent_id          = string
  })
  default = null
}

variable "project_id" {
  description = "Project id for all resources."
  type        = string
}

variable "regions" {
  description = "VPC regions."
  type        = map(string)
  default = {
    r1 = "europe-west1"
    r2 = "europe-west4"
  }
}

variable "vpn_configs" {
  description = "VPN configurations."
  type = map(object({
    asn           = number
    custom_ranges = map(string)
  }))
  default = {
    land-r1 = {
      asn = 64513
      custom_ranges = {
        "10.0.0.0/8" = "internal default"
      }
    }
    dev-r1 = {
      asn           = 64514
      custom_ranges = null
    }
    prod-r1 = {
      asn           = 64515
      custom_ranges = null
    }
  }
}

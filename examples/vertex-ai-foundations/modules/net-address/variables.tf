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

variable "external_addresses" {
  description = "Map of external address regions, keyed by name."
  type        = map(string)
  default     = {}
}

# variable "external_address_labels" {
#   description = "Optional labels for external addresses, keyed by address name."
#   type        = map(map(string))
#   default     = {}
# }

variable "global_addresses" {
  description = "List of global addresses to create."
  type        = list(string)
  default     = []
}

variable "internal_addresses" {
  description = "Map of internal addresses to create, keyed by name."
  type = map(object({
    region     = string
    subnetwork = string
    address    = optional(string)
    labels     = optional(map(string))
    purpose    = optional(string)
    tier       = optional(string)
  }))
  default = {}
}

# variable "internal_address_labels" {
#   description = "Optional labels for internal addresses, keyed by address name."
#   type        = map(map(string))
#   default     = {}
# }

variable "project_id" {
  description = "Project where the addresses will be created."
  type        = string
}

variable "psa_addresses" {
  description = "Map of internal addresses used for Private Service Access."
  type = map(object({
    address       = string
    network       = string
    prefix_length = number
  }))
  default = {}
}

variable "psc_addresses" {
  description = "Map of internal addresses used for Private Service Connect."
  type = map(object({
    address = string
    network = string
  }))
  default = {}
}

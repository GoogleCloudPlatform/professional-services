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

variable "apigee_envgroups" {
  description = "Apigee Environment Groups."
  type = map(object({
    environments = list(string)
    hostnames    = list(string)
  }))
  default = {}
}

variable "apigee_environments" {
  description = "Apigee Environment Names."
  type        = list(string)
  default     = []
}

variable "apigee_org_id" {
  description = "Apigee Organization ID."
  type        = string
}

variable "consumer_accept_list" {
  description = "List of projects (id/number) that can privately connect to the service attachment."
  type        = list(string)
  default     = null
}

variable "ip_range" {
  description = "Input: Customer-provided CIDR blocks of length 22 (e.g. `10.0.0.0/22`) Output: Main and Support CIDR (e.g. `10.0.0.0/22,10.1.0.0/28`)."
  type        = string
  default     = null
}

variable "disk_encryption_key" {
  description = "Customer Managed Encryption Key (CMEK) self link (e.g. `projects/foo/locations/us/keyRings/bar/cryptoKeys/baz`) used for disk and volume encryption (required for PAID Apigee Orgs only)."
  type        = string
  default     = null
}

variable "name" {
  description = "Apigee instance name."
  type        = string
}

variable "region" {
  description = "Compute region."
  type        = string
}

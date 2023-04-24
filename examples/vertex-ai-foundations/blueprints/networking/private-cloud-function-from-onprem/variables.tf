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

variable "ip_ranges" {
  description = "IP ranges used for the VPCs."
  type = object({
    onprem = string
    hub    = string
  })
  default = {
    onprem = "10.0.1.0/24",
    hub    = "10.0.2.0/24"
  }
}

variable "name" {
  description = "Name used for new resources."
  type        = string
  default     = "cf-via-psc"
}

variable "project_create" {
  description = "If non null, creates project instead of using an existing one."
  type = object({
    billing_account_id = string
    parent             = string
  })
  default = null
}

variable "project_id" {
  description = "Project id."
  type        = string
}

variable "psc_endpoint" {
  description = "IP used for the Private Service Connect endpoint, it must not overlap with the hub_ip_range."
  type        = string
  default     = "172.16.32.1"
}

variable "region" {
  description = "Region where the resources will be created."
  type        = string
  default     = "europe-west1"
}

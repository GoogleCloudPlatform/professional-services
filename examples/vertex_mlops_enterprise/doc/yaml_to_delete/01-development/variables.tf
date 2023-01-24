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

#TODO: tfdoc annotations

variable "billing_account" {
  # tfdoc:variable:source 00-bootstrap
  description = "Billing account id and organization id ('nnnnnnnn' or null)."
  type = object({
    id              = string
    organization_id = number
  })
}

variable "data_dir" {
  description = "Relative path for the folder storing configuration data."
  type        = string
  default     = "data/projects"
}

variable "defaults_file" {
  description = "Relative path for the file storing the project factory configuration."
  type        = string
  default     = "data/defaults.yaml"
}

variable "environment_dns_zone" {
  # tfdoc:variable:source 02-networking
  description = "DNS zone suffix for environment."
  type        = string
  default     = null
}

variable "host_project_ids" {
  # tfdoc:variable:source 02-networking
  description = "Host project for the shared VPC."
  type = object({
    dev-spoke-0 = string
  })
  default = null
}

variable "prefix" {
  # tfdoc:variable:source 00-bootstrap
  description = "Prefix used for resources that need unique names. Use 9 characters or less."
  type        = string

  validation {
    condition     = try(length(var.prefix), 0) < 10
    error_message = "Use a maximum of 9 characters for prefix."
  }
}

variable "vpc_self_links" {
  # tfdoc:variable:source 02-networking
  description = "Self link for the shared VPC."
  type = object({
    dev-spoke-0 = string
  })
  default = null
}

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

variable "allowed_domains" {
  description = "List of domains allowed by the squid proxy."
  type        = list(string)
  default = [
    ".google.com",
    ".github.com"
  ]
}

variable "billing_account" {
  description = "Billing account id used as default for new projects."
  type        = string
}

variable "cidrs" {
  description = "CIDR ranges for subnets."
  type        = map(string)
  default = {
    apps  = "10.0.0.0/24"
    proxy = "10.0.1.0/28"
  }
}

variable "mig" {
  description = "Enables the creation of an autoscaling managed instance group of squid instances."
  type        = bool
  default     = false
}

variable "nat_logging" {
  description = "Enables Cloud NAT logging if not null, value is one of 'ERRORS_ONLY', 'TRANSLATIONS_ONLY', 'ALL'."
  type        = string
  default     = "ERRORS_ONLY"
}

variable "prefix" {
  description = "Prefix used for resources that need unique names."
  type        = string
}

variable "region" {
  description = "Default region for resources."
  type        = string
  default     = "europe-west1"
}

variable "root_node" {
  description = "Root node for the new hierarchy, either 'organizations/org_id' or 'folders/folder_id'."
  type        = string
}

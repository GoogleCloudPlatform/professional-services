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

variable "org_id" {
  description = "The organization id for the associated services"
  type        = string
}

variable "billing_account" {
  description = "The ID of the billing account to associate this project with"
  type        = string
}

variable "folder_name" {
  description = "Parent folder for projects, folder should be child of organization"
  type        = string
}

variable "composer_worker_tags" {
  description = "network tags which will be applied to composer workers"
  type        = list(string)
  default     = ["composer-worker"]
}

variable "composer_subnets" {
  description = "subnets for composer workers"
  type = map(object({
    description    = string
    cidr_range     = string
    region         = string
    private_access = bool
    flow_logs      = bool
    secondary_ranges = list(object({
      range_name    = string
      ip_cidr_range = string
    }))
  }))
  default = {}
}

variable "deny_all_egrees_rule_create" {
  description = "Create deny all egress"
  type        = bool
  default     = true
}

variable "prefix" {
  description = "prefix for resource names"
  type        = string
}
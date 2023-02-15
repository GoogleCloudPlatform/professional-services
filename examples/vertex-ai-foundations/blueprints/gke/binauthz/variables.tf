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

variable "project_create" {
  description = "Parameters for the creation of the new project."
  type = object({
    billing_account_id = string
    parent             = string
  })
  default = null
}

variable "project_id" {
  description = "Project ID."
  type        = string
}

variable "prefix" {
  description = "Prefix for resources created."
  type        = string
  default     = null
}

variable "pods_cidr_block" {
  description = "Pods CIDR block."
  type        = string
  default     = "172.16.0.0/20"
}

variable "services_cidr_block" {
  description = "Services CIDR block."
  type        = string
  default     = "192.168.0.0/24"
}

variable "master_cidr_block" {
  description = "Master CIDR block."
  type        = string
  default     = "10.0.0.0/28"
}

variable "subnet_cidr_block" {
  description = "Subnet CIDR block."
  type        = string
  default     = "10.0.1.0/24"
}

variable "region" {
  description = "Region."
  type        = string
  default     = "europe-west1"
}

variable "zone" {
  description = "Zone."
  type        = string
  default     = "europe-west1-c"
}

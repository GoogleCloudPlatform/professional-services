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


variable "location" {
  description = "The location where resources will be deployed."
  type        = string
  default     = "EU"
}

variable "project_id" {
  description = "Project id, references existing project if `project_create` is null."
  type        = string
}

variable "project_create" {
  description = "Provide values if project creation is needed, uses existing project if null. Parent format:  folders/folder_id or organizations/org_id"
  type = object({
    billing_account_id = string
    parent             = string
  })
  default = null
}

variable "prefix" {
  description = "Unique prefix used for resource names. Not used for project if 'project_create' is null."
  type        = string
}

variable "region" {
  description = "The region where resources will be deployed."
  type        = string
  default     = "europe-west1"
}

variable "service_encryption_keys" { # service encription key
  description = "Cloud KMS to use to encrypt different services. Key location should match service region."
  type = object({
    bq      = string
    compute = string
    storage = string
  })
  default = null
}

variable "vpc_config" {
  description = "Parameters to create a VPC."
  type = object({
    ip_cidr_range = string
  })
  default = {
    ip_cidr_range = "10.0.0.0/20"
  }
}

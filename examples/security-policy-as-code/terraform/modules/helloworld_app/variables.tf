/**
 * Copyright 2020 Google LLC
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

variable "region" {
  description = "The region for this module's infrastructure"
}
variable "service_account_email" {
  description = "The Service Account Email ID to use for the Cluster"
}

//variable "enabled" {
//  description = "This module can be disabled by explicitly setting this to `false`. Default is `true`"
//  default     = "true"
//}

variable "project_id" {
  description = "The project to build this module's infrastructure"
}

variable "disk_encryption_key" {
  description = "The KMS Key self link to use for Disk Encryption"
}
variable "network_project_id" {
  description = "The project that contains the VPC for this module"
}

variable "subnetwork_name" {
  description = "The simple name of the subnetwork."
}

variable "vpc_name" {
  description = "The Name of the VPC to use for this module"
}

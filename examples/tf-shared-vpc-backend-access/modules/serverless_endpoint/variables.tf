# Copyright 2021 Google LLC
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

variable "cloud_run_project" {
  type        = string
  description = "Project where GCLB + Cloud Run are deployed"
}

variable "shared_vpc_host_project" {
  type        = string
  description = "Project to host the shared VPC and to deploy the serverless connector and an example server"
}

variable "name" {
  type        = string
  description = "A name for your installation, not long since the connector name must be not more than 25 characters"
  default     = "tst-install"
}

variable "region" {
  type        = string
  description = "Region for your resources"
  default     = "europe-west4"
}

# This is used in networking.tf, serverless_endpoint.tf and hardcoded in index.js
variable "ip_prefix" {
  type        = string
  description = "IP prefix for created networks (see also index.js)"
  default     = "192.168"
}

# Documentation here: https://cloud.google.com/armor/docs/security-policy-overview#ip-address-rules
variable "source_ip_range_for_security_policy" {
  type        = list(string)
  description = "Array of Cloud Armor security policy allowed IP ranges (put your IP as an array here)"
}

variable "cloud_run_invoker" {
  type        = string
  description = "IAM member authorized to access the end-point (for example, 'user:YOUR_IAM_USER' for only you or 'allUsers' for everyone)"
  default     = "allUsers"
}

variable "shared_vpc_host_name" {
  type        = string
  description = "Shared VPC host name (created in networking.tf)"
  default     = "shared-vpc"
}

variable "shared_vpc_host_connector_name" {
  type        = string
  description = "Shared VPC host connector name (created in networking.tf)"
}
variable "shared_vpc_self_link" {
  type        = string
  description = "Shared VPC reference (created in networking.tf)"
}

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
  description = "Project where GCLB + Cloud Run is deployed"
}

variable "shared_vpc_host_project" {
  type        = string
  description = "Project to host the shared VPC and to deploy the serverless connector and an example server"
}

variable "name" {
  type        = string
  description = <<EOT
Some name for your installation, don't make this too long since the connector name must be not more than 25 characters.
EOT
  default     = "tst-install"
}

variable "region" {
  type        = string
  description = "Region for your resources"
  default     = "europe-west4"
}

locals {
  # This value can not be a variable since it's derived from another variable. You can redefine it here.
  example_server_image = "gcr.io/${var.cloud_run_project}/helloproxy"

  # Documentation here: https://cloud.google.com/vpc/docs/configure-serverless-vpc-access#firewall-rules-shared-vpc
  firewall_nat_ip_ranges         = ["107.178.230.64/26", "35.199.224.0/19", ]
  firewall_healthcheck_ip_ranges = ["130.211.0.0/22", "35.191.0.0/16", "108.170.220.0/23", ]
}

# This is used in networking.tf, serverless_endpoint.tf and hardcoded in index.js
variable "ip_prefix" {
  type        = string
  description = "IP prefix for created networks (see also index.js)"
  default     = "192.168"
}

# Documentation here: https://cloud.google.com/armor/docs/security-policy-overview#ip-address-rules
variable "security_policy_source_ip_range" {
  type        = list(string)
  description = "Array of Cloud Armor security policy allowed IP ranges (put your IP as an array here)"
}

variable "cloud_run_invoker" {
  type        = string
  description = <<EOT
IAM member who is authorized to access the end-point.
Use either "user:YOUR_IAM_USER" for granting access only to yourself or "allUsers" to give access to everyone.
EOT
  default     = "allUsers"
}

data "google_project" "project" {
  project_id = var.cloud_run_project
}
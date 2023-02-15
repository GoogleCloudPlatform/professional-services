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

variable "project_create" {
  description = "Parameters for the creation of the new project."
  type = object({
    billing_account_id = string
    parent             = string
  })
  default = null
}

variable "project_id" {
  description = "Host project ID."
  type        = string
}

variable "prefix" {
  description = "Prefix for the resources created."
  type        = string
  default     = null
}

variable "network_config" {
  description = "Network configuration"
  type = object({
    network = string
    subnet  = string
  })
  default = null
}

variable "ad_dns_domain_name" {
  description = "AD DNS domain name."
  type        = string
}

variable "adfs_dns_domain_name" {
  description = "ADFS DNS domain name."
  type        = string
}

variable "disk_size" {
  description = "Disk size."
  type        = number
  default     = 50
}

variable "disk_type" {
  description = "Disk type."
  type        = string
  default     = "pd-ssd"
}

variable "image" {
  description = "Image."
  type        = string
  default     = "projects/windows-cloud/global/images/family/windows-2022"
}

variable "instance_type" {
  description = "Instance type."
  type        = string
  default     = "n1-standard-2"
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

variable "ad_ip_cidr_block" {
  description = "Managed AD IP CIDR block."
  type        = string
  default     = "10.0.0.0/24"
}

variable "subnet_ip_cidr_block" {
  description = "Subnet IP CIDR block."
  type        = string
  default     = "10.0.1.0/28"
}
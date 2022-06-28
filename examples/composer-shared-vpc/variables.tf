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

variable "org_id" {
  description = "The organization id for the associated services"
  type        = string
}

variable "terraform_service_account" {
  description = "Service account email of the account to impersonate to run Terraform."
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

variable "vm_ext_ip_access_policy_create" {
  description = "Create VM external policy constraint at project level to allow public IPs for public composer envs"
  type        = bool
  default     = true
}

variable "composer_v1_private_envs" {
  description = "composer v1 private envs"
  type = map(object({
    region                = string
    zone                  = string
    pod_ip_range_name     = string
    service_ip_range_name = string
    subnet                = string
    control_plane_cidr    = string
    web_server_cidr       = string
    cloud_sql_cidr        = string
    tags                  = list(string)
    software_config = object({
      airflow_config_overrides = map(string)
      env_variables            = map(string)
      image_version            = string
      pypi_packages            = map(string)
      python_version           = string
    })
  }))
  default = {}
}

variable "composer_v2_private_envs" {
  description = "composer v2 private envs"
  type = map(object({
    region                      = string
    zone                        = string
    pod_ip_range_name           = string
    service_ip_range_name       = string
    subnet                      = string
    control_plane_cidr          = string
    composer_network_ipv4_cidr  = string
    cloud_sql_cidr              = string
    tags                        = list(string)
    software_config = object({
      airflow_config_overrides = map(string)
      env_variables            = map(string)
      image_version            = string
      pypi_packages            = map(string)
      python_version           = string
    })
  }))
  default = {}
}

variable "prefix" {
  description = "prefix for resource names"
  type        = string
}

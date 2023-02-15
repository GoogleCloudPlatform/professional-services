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

variable "prefix" {
  description = "Prefix used for resources (for multiple clusters in a project)"
  type        = string
  default     = "aog"
}

variable "region" {
  description = "Region for resources"
  type        = string
  default     = "europe-west4"
}

variable "project_id" {
  description = "Google Cloud project ID"
  type        = string
}

variable "shared_vpc_project_id" {
  description = "Shared VPC project ID for firewall rules"
  type        = string
  default     = null
}

variable "network" {
  description = "Network to use in the project"
  type        = string
}

variable "subnetwork" {
  description = "Subnetwork to use in the project"
  type        = string
}

variable "cluster_name" {
  description = "Cluster name (prepended with prefix)"
  type        = string
  default     = "cluster"
}

variable "sql_client_cidrs" {
  description = "CIDR ranges that are allowed to connect to SQL Server"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "health_check_ranges" {
  description = "Health check ranges"
  type        = list(string)
  default     = ["35.191.0.0/16", "209.85.152.0/22", "209.85.204.0/22"]
}

variable "node_instance_type" {
  description = "SQL Server database node instance type"
  type        = string
  default     = "n2-standard-8"
}

variable "witness_instance_type" {
  description = "SQL Server witness node instance type"
  type        = string
  default     = "n2-standard-2"
}

variable "node_image" {
  description = "SQL Server node machine image"
  type        = string
  default     = "projects/windows-sql-cloud/global/images/family/sql-ent-2019-win-2019"
}

variable "witness_image" {
  description = "SQL Server witness machine image"
  type        = string
  default     = "projects/windows-cloud/global/images/family/windows-2019"
}

variable "boot_disk_size" {
  description = "Boot disk size in GB"
  type        = number
  default     = 50
}

variable "data_disk_size" {
  description = "Database disk size in GB"
  type        = number
  default     = 200
}

variable "sql_admin_password" {
  description = "Password for the SQL admin user to be created"
  type        = string
  validation {
    condition     = length(var.sql_admin_password) > 0
    error_message = "SQL administrator password needs to be specified."
  }
}

variable "ad_domain_fqdn" {
  description = "Active Directory domain (FQDN)"
  type        = string
  validation {
    condition     = length(var.ad_domain_fqdn) > 0
    error_message = "Active Directory domain needs to be specified."
  }
}

variable "ad_domain_netbios" {
  description = "Active Directory domain (NetBIOS)"
  type        = string
  validation {
    condition     = length(var.ad_domain_netbios) > 0
    error_message = "Active Directory domain needs to be specified."
  }
}

variable "managed_ad_dn" {
  description = "Managed Active Directory domain (eg. OU=Cloud,DC=example,DC=com)"
  type        = string
  default     = ""
}

variable "always_on_groups" {
  description = "List of Always On Groups"
  type        = list(string)
  default     = ["bookshelf"]
}

variable "health_check_port" {
  description = "Health check port"
  type        = number
  default     = 59997
}

variable "health_check_config" {
  description = "Health check configuration"
  type = object({ check_interval_sec = number,
    healthy_threshold   = number,
    unhealthy_threshold = number,
    timeout_sec         = number,
  })
  default = {
    check_interval_sec  = 2
    healthy_threshold   = 1
    unhealthy_threshold = 2
    timeout_sec         = 1
  }
}

variable "node_name" {
  description = "Node base name"
  type        = string
  default     = "node"
}

variable "witness_name" {
  description = "Witness base name"
  type        = string
  default     = "witness"
}

variable "project_create" {
  description = "Provide values if project creation is needed, uses existing project if null. Parent is in 'folders/nnn' or 'organizations/nnn' format."
  type = object({
    billing_account_id = string
    parent             = string
  })
  default = null
}

variable "vpc_ip_cidr_range" {
  description = "Ip range used in the subnet deployef in the Service Project."
  type        = string
  default     = "10.0.0.0/20"
}

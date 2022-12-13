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

variable "service_encryption_keys" {
  description = "Cloud KMS keys to use to encrypt resources. Provide a key for each reagion configured."
  type        = map(string)
  default     = null
}

variable "data_eng_principals" {
  description = "Groups with Service Account Token creator role on service accounts in IAM format, only user supported on CloudSQL, eg 'user@domain.com'."
  type        = list(string)
  default     = []
}

variable "network_config" {
  description = "Shared VPC network configurations to use. If null networks will be created in projects with preconfigured values."
  type = object({
    host_project       = string
    network_self_link  = string
    subnet_self_link   = string
    cloudsql_psa_range = string
  })
  default = null
}

variable "postgres_user_password" {
  description = "`postgres` user password."
  type        = string
}

variable "postgres_database" {
  description = "`postgres` database."
  type        = string
  default     = "guestbook"
}

variable "prefix" {
  description = "Unique prefix used for resource names. Not used for project if 'project_create' is null."
  type        = string
}

variable "project_create" {
  description = "Provide values if project creation is needed, uses existing project if null. Parent is in 'folders/nnn' or 'organizations/nnn' format."
  type = object({
    billing_account_id = string
    parent             = string
  })
  default = null
}

variable "project_id" {
  description = "Project id, references existing project if `project_create` is null."
  type        = string
}

variable "regions" {
  description = "Map of instance_name => location where instances will be deployed."
  type        = map(string)
  validation {
    condition     = contains(keys(var.regions), "primary")
    error_message = "Regions map must contain `primary` as a key."
  }
  default = {
    primary = "europe-west1"
    replica = "europe-west3"
  }
}


variable "sql_configuration" {
  description = "Cloud SQL configuration"
  type = object({
    availability_type = string
    database_version  = string
    psa_range         = string
    tier              = string
  })
  default = {
    availability_type = "REGIONAL"
    database_version  = "POSTGRES_13"
    psa_range         = "10.60.0.0/16"
    tier              = "db-g1-small"
  }
}

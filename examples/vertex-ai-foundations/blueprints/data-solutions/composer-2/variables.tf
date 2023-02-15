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

variable "composer_config" {
  description = "Composer environment configuration. It accepts only following attributes: `environment_size`, `software_config` and `workloads_config`. See [attribute reference](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/composer_environment#argument-reference---cloud-composer-2) for details on settings variables."
  type = object({
    environment_size = string
    software_config  = any
    workloads_config = object({
      scheduler = object(
        {
          cpu        = number
          memory_gb  = number
          storage_gb = number
          count      = number
        }
      )
      web_server = object(
        {
          cpu        = number
          memory_gb  = number
          storage_gb = number
        }
      )
      worker = object(
        {
          cpu        = number
          memory_gb  = number
          storage_gb = number
          min_count  = number
          max_count  = number
        }
      )
    })
  })
  default = {
    environment_size = "ENVIRONMENT_SIZE_SMALL"
    software_config = {
      image_version = "composer-2-airflow-2"
    }
    workloads_config = null
  }
}

variable "iam_groups_map" {
  description = "Map of Role => groups to be added on the project. Example: { \"roles/composer.admin\" = [\"group:gcp-data-engineers@example.com\"]}."
  type        = map(list(string))
  default     = null
}

variable "network_config" {
  description = "Shared VPC network configurations to use. If null networks will be created in projects with preconfigured values."
  type = object({
    host_project      = string
    network_self_link = string
    subnet_self_link  = string
    composer_secondary_ranges = object({
      pods     = string
      services = string
    })
  })
  default = null
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

variable "region" {
  description = "Reagion where instances will be deployed."
  type        = string
  default     = "europe-west1"
}

variable "service_encryption_keys" {
  description = "Cloud KMS keys to use to encrypt resources. Provide a key for each reagion in use."
  type        = map(string)
  default     = null
}

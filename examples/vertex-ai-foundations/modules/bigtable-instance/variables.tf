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

variable "cluster_id" {
  description = "The ID of the Cloud Bigtable cluster."
  type        = string
  default     = "europe-west1"
}

variable "deletion_protection" {
  description = "Whether or not to allow Terraform to destroy the instance. Unless this field is set to false in Terraform state, a terraform destroy or terraform apply that would delete the instance will fail."
  default     = true
}

variable "display_name" {
  description = "The human-readable display name of the Bigtable instance."
  default     = null
}

variable "iam" {
  description = "IAM bindings for topic in {ROLE => [MEMBERS]} format."
  type        = map(list(string))
  default     = {}
}

variable "instance_type" {
  description = "(deprecated) The instance type to create. One of 'DEVELOPMENT' or 'PRODUCTION'."
  type        = string
  default     = null
}

variable "name" {
  description = "The name of the Cloud Bigtable instance."
  type        = string
}

variable "num_nodes" {
  description = "The number of nodes in your Cloud Bigtable cluster."
  type        = number
  default     = 1
}

variable "project_id" {
  description = "Id of the project where datasets will be created."
  type        = string
}

variable "storage_type" {
  description = "The storage type to use."
  type        = string
  default     = "SSD"
}

variable "table_options_defaults" {
  description = "Default option of tables created in the BigTable instance."
  type = object({
    split_keys    = list(string)
    column_family = string
  })
  default = {
    split_keys    = []
    column_family = null
  }
}

variable "tables" {
  description = "Tables to be created in the BigTable instance, options can be null."
  type = map(object({
    split_keys    = list(string)
    column_family = string
  }))
  default = {}
}

variable "zone" {
  description = "The zone to create the Cloud Bigtable cluster in."
  type        = string
}

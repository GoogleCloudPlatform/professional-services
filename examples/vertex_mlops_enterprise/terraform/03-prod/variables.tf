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


variable "bucket_name" {
  description = "Create GCS Bucket."
  type        = string
  default     = null
}

variable "dataset_name" {
  description = "Create BigQuery Datasets."
  type        = string
  default     = null
}

variable "group_iam" {
  description = "Authoritative IAM binding for organization groups, in {GROUP_EMAIL => [ROLES]} format."
  type        = map(list(string))
  default     = {}
  nullable    = false
}

variable "identity_pool_claims" {
  type    = string
  default = null
}

variable "labels" {
  description = "Labels to be assigned at project level."
  type        = map(string)
  default     = {}
}

variable "notebooks" {
  description = "Vertex AI workbenchs to be deployed."
  type        = any
  default     = {}
}

variable "prefix" {
  description = "Prefix used for the project id."
  type        = string
  default     = null
}

variable "project_id" {
  description = "Project id."
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

variable "region" {
  description = "Region used for regional resources."
  type        = string
  default     = "europe-west4"
}

variable "sa_mlops_name" {
  description = "Name for the MLOPs Service Account."
  type        = string
  default     = "sa-mlops"
}

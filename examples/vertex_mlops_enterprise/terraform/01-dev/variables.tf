/**
 * Copyright 2023 Google LLC
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

variable "environment" {
  description = "Environment prefix that will be used when creating some resources and outputs (Github Actions, build files, etc.): dev, stg, prod"
  type        = string
}

variable "groups" {
  description = "Name of the groups (name@domain.org) to apply IAM permissions."
  type = object({
    gcp-ml-ds     = string
    gcp-ml-eng    = string
    gcp-ml-viewer = string
  })
  default = {
    gcp-ml-ds     = null
    gcp-ml-eng    = null
    gcp-ml-viewer = null
  }
  nullable = false
}

variable "github" {
  description = "Github organization and repo, i.e: https://github.com/ORGANIZATION/REPO "
  type = object({
    organization = string
    repo         = string
  })
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

variable "project_config" {
  description = "Provide 'billing_account_id' value if project creation is needed, uses existing 'project_id' if null. Parent is in 'folders/nnn' or 'organizations/nnn' format."
  type = object({
    billing_account_id = optional(string)
    parent             = optional(string)
    project_id         = string
  })
  validation {
    condition     = var.project_config.project_id != null
    error_message = "Project id must be set."
  }
  nullable = false
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

variable "service_encryption_keys" {
  description = "Cloud KMS to use to encrypt different services. Key location should match service region."
  type = object({
    aiplatform    = optional(string)
    bq            = optional(string)
    notebooks     = optional(string)
    secretmanager = optional(string)
    storage       = optional(string)
  })
  default  = {}
  nullable = false
}
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

variable "project_id" {
  description = "Project where resources will be created."
  type        = string
}

variable "gcp_service_list" {
  description = "The list of apis necessary for Vertex Pipelines"
  type        = list(string)
  default = [
    "aiplatform.googleapis.com",
    "storage-component.googleapis.com"
  ]
}

variable "disable_services_on_destroy" {
  description = "If true, disable the service when the Terraform resource is destroyed. Defaults to true."
  type        = bool
  default     = true
}

variable "sa_account_id" {
  description = "The account id that is used to generate the service account email address and a stable unique id."
  type        = string
  default     = "vertexpipelinesa"
}

variable "sa_display_name" {
  description = "The display name for the service account. Can be updated without creating a new resource."
  type        = string
  default     = null
}

variable "role_id" {
  description = "The camel case role id to use for this role. Cannot contain '-' characters."
  type        = string
  default     = "vertexPipelineRole"
}

variable "role_title" {
  description = "A human-readable title for the role."
  type        = string
  default     = "Vertex Pipeline User"
}

variable "role_description" {
  description = "A human-readable description for the role."
  type        = string
  default     = null
}

variable "role_permissions" {
  description = "The names of the minimum permissions needed to run Vertex Pipelines. This role grants when bound in an IAM policy."
  type        = list(string)
  default     = ["aiplatform.metadataStores.get", "storage.objects.create", "storage.objects.get", "aiplatform.metadataStores.create"]
}

variable "additional_roles" {
  description = "Additional roles needed for any Google Cloud resources that you use in your pipelines."
  type        = list(string)
  default     = []
}

variable "pipeline_runners" {
  description = "User accounts used to run pipelines with this service account"
  type        = list(string)
}

variable "bucket_name" {
  description = "The name of the pipeline bucket"
  type        = string
  default     = null
}

variable "bucket_location" {
  description = "The region of the pipeline bucket"
  type        = string
  default     = "us-central1"
}

variable "bucket_sa_roles" {
  description = "The roles your Service Account will be able to perform on the bucket"
  type        = list(string)
  default     = ["roles/storage.objectCreator", "roles/storage.objectViewer"]
}

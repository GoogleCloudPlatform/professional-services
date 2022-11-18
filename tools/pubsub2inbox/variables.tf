#   Copyright 2022 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
variable "project_id" {
  type        = string
  description = "Project ID"
}

variable "organization_id" {
  type        = number
  description = "Organization ID"
  default     = 0
}

variable "function_name" {
  type        = string
  description = "Cloud Function name"
}

variable "function_roles" {
  type        = list(string)
  description = "Types of the function to assign permissions"
}

variable "pubsub_topic" {
  type        = string
  description = "Pub/Sub topic (projects/project-id/topics/topic-id)"
}

variable "region" {
  type        = string
  description = "Project ID"

  default = "europe-west1"
}

variable "secret_id" {
  type        = string
  description = "Secret Manager secret ID"

  default = ""
}

variable "config_file" {
  type        = string
  description = "Configuration file (either specify config_file or config)"

  default = "config.yaml"
}

variable "config" {
  type        = string
  description = "Configuration contents (either specify config_file or config)"

  default = null
}

variable "service_account" {
  type        = string
  description = "Service account name"

  default = ""
}

variable "bucket_name" {
  type        = string
  description = "Bucket for storing the Cloud Function"

  default = "cf-pubsub2inbox"
}

variable "bucket_location" {
  type        = string
  description = "Location of a bucket for storing the Cloud Function"

  default = "EU"
}

variable "helper_bucket_name" {
  type        = string
  description = "Helper bucket name for granting IAM permission (storage.objectAdmin)"
  default     = ""
}

variable "function_timeout" {
  type        = number
  description = "Cloud Function timeout (maximum 540 seconds)"
  default     = 240
}

variable "retry_minimum_backoff" {
  type        = string
  description = "Minimum retry backoff (value between 0-600 seconds, suffixed with s, default 10s, Cloud Run only)"
  default     = "10s"
}

variable "retry_maximum_backoff" {
  type        = string
  description = "Maximum retry backoff (value between 0-600 seconds, suffixed with s, default 600s, Cloud Run Only)"
  default     = "600s"
}

variable "cloud_run" {
  type        = bool
  description = "Deploy via Cloud Run"
  default     = false
}

variable "cloud_run_container" {
  type        = string
  description = "Container URL when deploying via Cloud Run"
  default     = ""
}

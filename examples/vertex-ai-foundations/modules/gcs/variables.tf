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

variable "cors" {
  description = "CORS configuration for the bucket. Defaults to null."
  type = object({
    origin          = list(string)
    method          = list(string)
    response_header = list(string)
    max_age_seconds = number
  })
  default = null
}

variable "encryption_key" {
  description = "KMS key that will be used for encryption."
  type        = string
  default     = null
}

variable "force_destroy" {
  description = "Optional map to set force destroy keyed by name, defaults to false."
  type        = bool
  default     = false
}

variable "iam" {
  description = "IAM bindings in {ROLE => [MEMBERS]} format."
  type        = map(list(string))
  default     = {}
}

variable "labels" {
  description = "Labels to be attached to all buckets."
  type        = map(string)
  default     = {}
}

variable "lifecycle_rule" {
  description = "Bucket lifecycle rule."
  type = object({
    action = object({
      type          = string
      storage_class = string
    })
    condition = object({
      age                        = number
      created_before             = string
      with_state                 = string
      matches_storage_class      = list(string)
      num_newer_versions         = string
      custom_time_before         = string
      days_since_custom_time     = string
      days_since_noncurrent_time = string
      noncurrent_time_before     = string
    })
  })
  default = null
}

variable "location" {
  description = "Bucket location."
  type        = string
  default     = "EU"
}

variable "logging_config" {
  description = "Bucket logging configuration."
  type = object({
    log_bucket        = string
    log_object_prefix = string
  })
  default = null
}

variable "name" {
  description = "Bucket name suffix."
  type        = string
}

variable "notification_config" {
  description = "GCS Notification configuration."
  type = object({
    enabled           = bool
    payload_format    = string
    topic_name        = string
    sa_email          = string
    event_types       = list(string)
    custom_attributes = map(string)
  })
  default = null
}
variable "prefix" {
  description = "Prefix used to generate the bucket name."
  type        = string
  default     = null
}

variable "project_id" {
  description = "Bucket project id."
  type        = string
}

variable "retention_policy" {
  description = "Bucket retention policy."
  type = object({
    retention_period = number
    is_locked        = bool
  })
  default = null
}

variable "storage_class" {
  description = "Bucket storage class."
  type        = string
  default     = "MULTI_REGIONAL"
  validation {
    condition     = contains(["STANDARD", "MULTI_REGIONAL", "REGIONAL", "NEARLINE", "COLDLINE", "ARCHIVE"], var.storage_class)
    error_message = "Storage class must be one of STANDARD, MULTI_REGIONAL, REGIONAL, NEARLINE, COLDLINE, ARCHIVE."
  }
}

variable "uniform_bucket_level_access" {
  description = "Allow using object ACLs (false) or not (true, this is the recommended behavior) , defaults to true (which is the recommended practice, but not the behavior of storage API)."
  type        = bool
  default     = true
}

variable "versioning" {
  description = "Enable versioning, defaults to false."
  type        = bool
  default     = false
}

variable "website" {
  description = "Bucket website."
  type = object({
    main_page_suffix = string
    not_found_page   = string
  })
  default = null
}

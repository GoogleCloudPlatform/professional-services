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

variable "api_id" {
  description = "API identifier."
  type        = string
}

variable "iam" {
  description = "IAM bindings for the API in {ROLE => [MEMBERS]} format."
  type        = map(list(string))
  default     = null
}

variable "labels" {
  description = "Map of labels."
  type        = map(string)
  default     = null
}

variable "project_id" {
  description = "Project identifier."
  type        = string
}

variable "region" {
  description = "Region"
  type        = string
}

variable "service_account_create" {
  description = "Flag indicating whether a service account needs to be created"
  type        = bool
  default     = false
}

variable "service_account_email" {
  description = "Service account for creating API configs"
  type        = string
  default     = null
}

variable "spec" {
  description = "String with the contents of the OpenAPI spec."
  type        = string
}

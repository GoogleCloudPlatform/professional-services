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

variable "alert_create" {
  description = "Enables the creation of a sample monitoring alert, false by default."
  type        = bool
  default     = false
}

variable "bundle_path" {
  description = "Path used to write the intermediate Cloud Function code bundle."
  type        = string
  default     = "./bundle.zip"
}

variable "name" {
  description = "Arbitrary string used to name created resources."
  type        = string
  default     = "quota-monitor"
}

variable "project_create" {
  description = "Create project instead of using an existing one."
  type        = bool
  default     = false
}

variable "project_id" {
  description = "Project id that references existing project."
  type        = string
}

variable "quota_config" {
  description = "Cloud function configuration."
  type = object({
    filters  = list(string)
    projects = list(string)
    regions  = list(string)
  })
  default = {
    filters  = null
    projects = null
    regions  = null
  }
}

variable "region" {
  description = "Compute region used in the example."
  type        = string
  default     = "europe-west1"
}

variable "schedule_config" {
  description = "Schedule timer configuration in crontab format."
  type        = string
  default     = "0 * * * *"
}

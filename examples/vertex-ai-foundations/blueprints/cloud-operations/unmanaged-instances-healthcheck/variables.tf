# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


variable "billing_account" {
  description = "Billing account id used as default for new projects."
  type        = string
}

variable "location" {
  description = "App Engine location used in the example (required for CloudFunctions)."
  type        = string
  default     = "europe-west"
}

variable "project_create" {
  description = "Create project instead of using an existing one."
  type        = bool
  default     = false
}

variable "project_id" {
  description = "Project id to create a project when `project_create` is `true`, or to be used when `false`."
  type        = string
}

variable "region" {
  description = "Compute region used in the example."
  type        = string
  default     = "europe-west1"
}

variable "root_node" {
  description = "The resource name of the parent folder or organization for project creation, in 'folders/folder_id' or 'organizations/org_id' format."
  type        = string
  default     = null
}

variable "schedule" {
  description = "Cron schedule for executing compute instances healthcheck."
  type        = string
  default     = "*/5 * * * *" # every five minutes
}

variable "grace_period" {
  description = "Grace period for an instance startup."
  type        = string
  default     = "180s"
}

variable "tcp_port" {
  description = "TCP port to run healthcheck against."
  type        = string
  default     = "80" #http
}

variable "timeout" {
  description = "TCP probe timeout."
  type        = string
  default     = "1000ms"
}

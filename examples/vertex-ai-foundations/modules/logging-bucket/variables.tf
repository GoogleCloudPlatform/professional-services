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

variable "description" {
  description = "Human-readable description for the logging bucket."
  type        = string
  default     = null
}

variable "id" {
  description = "Name of the logging bucket."
  type        = string
}

variable "location" {
  description = "Location of the bucket."
  type        = string
  default     = "global"
}

variable "parent" {
  description = "ID of the parentresource containing the bucket in the format 'project_id' 'folders/folder_id', 'organizations/organization_id' or 'billing_account_id'."
  type        = string
}

variable "parent_type" {
  description = "Parent object type for the bucket (project, folder, organization, billing_account)."
  type        = string
}

variable "retention" {
  description = "Retention time in days for the logging bucket."
  type        = number
  default     = 30
}

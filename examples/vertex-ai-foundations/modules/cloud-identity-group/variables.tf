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

variable "customer_id" {
  description = "Directory customer ID in the form customers/C0xxxxxxx."
  type        = string
  validation {
    condition     = can(regex("^customers/C0[a-z0-9]{7}$", var.customer_id))
    error_message = "Customer ID must be in the form customers/C0xxxxxxx."
  }
}

variable "description" {
  description = "Group description."
  type        = string
  default     = null
}

variable "display_name" {
  description = "Group display name."
  type        = string
}

variable "managers" {
  description = "List of group managers."
  type        = list(string)
  default     = []
}

variable "members" {
  description = "List of group members."
  type        = list(string)
  default     = []
}

variable "name" {
  description = "Group ID (usually an email)."
  type        = string
}

# variable "owners" {
#   description = "List of group owners."
#   type        = list(string)
#   default     = []
# }

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

variable "network_tags" {
  description = "Network tags by key name. If `id` is provided, key creation is skipped. The `iam` attribute behaves like the similarly named one at module level."
  type = map(object({
    description = optional(string, "Managed by the Terraform organization module.")
    iam         = optional(map(list(string)), {})
    id          = optional(string)
    network     = string # project_id/vpc_name
    values = optional(map(object({
      description = optional(string, "Managed by the Terraform organization module.")
      iam         = optional(map(list(string)), {})
    })), {})
  }))
  nullable = false
  default  = {}
  validation {
    condition = (
      alltrue([
        for k, v in var.network_tags : v != null
      ]) &&
      # all values are non-null
      alltrue(flatten([
        for k, v in var.network_tags : [for k2, v2 in v.values : v2 != null]
      ]))
    )
    error_message = "Use an empty map instead of null as value."
  }
}

variable "tag_bindings" {
  description = "Tag bindings for this organization, in key => tag value id format."
  type        = map(string)
  default     = {}
  nullable    = false
}

variable "tags" {
  description = "Tags by key name. If `id` is provided, key or value creation is skipped. The `iam` attribute behaves like the similarly named one at module level."
  type = map(object({
    description = optional(string, "Managed by the Terraform organization module.")
    iam         = optional(map(list(string)), {})
    id          = optional(string)
    values = optional(map(object({
      description = optional(string, "Managed by the Terraform organization module.")
      iam         = optional(map(list(string)), {})
      id          = optional(string)
    })), {})
  }))
  nullable = false
  default  = {}
  validation {
    condition = (
      # all keys are non-null
      alltrue([
        for k, v in var.tags : v != null
      ]) &&
      # all values are non-null
      alltrue(flatten([
        for k, v in var.tags : [for k2, v2 in v.values : v2 != null]
      ]))
    )
    error_message = "Use an empty map instead of null as value."
  }
}

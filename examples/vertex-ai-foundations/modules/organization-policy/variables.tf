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

variable "config_directory" {
  description = "Paths to a folder where organization policy configs are stored in yaml format. Files suffix must be `.yaml`."
  type        = string
  default     = null
}

variable "policies" {
  description = "Organization policies keyed by parent in format `projects/project-id`, `folders/1234567890` or `organizations/1234567890`."
  type = map(map(object({
    inherit_from_parent = optional(bool) # List policy only.
    reset               = optional(bool)
    rules = optional(
      list(object({
        allow   = optional(list(string)) # List policy only. Stands for `allow_all` if set to empty list `[]` or to `values.allowed_values` if set to a list of values 
        deny    = optional(list(string)) # List policy only. Stands for `deny_all` if set to empty list `[]` or to `values.denied_values` if set to a list of values
        enforce = optional(bool)         # Boolean policy only.    
        condition = optional(
          object({
            description = optional(string)
            expression  = optional(string)
            location    = optional(string)
            title       = optional(string)
          })
        )
      }))
    )
  })))
  default = {}
}

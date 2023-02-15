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

variable "cloud_config" {
  description = "Cloud config template path. If null default will be used."
  type        = string
  default     = null
}

variable "config_variables" {
  description = "Additional variables used to render the cloud-config and Squid templates."
  type        = map(any)
  default     = {}
}

variable "docker_logging" {
  description = "Log via the Docker gcplogs driver. Disable if you use the legacy Logging Agent instead."
  type        = bool
  default     = true
}

variable "squid_config" {
  description = "Squid configuration path, if null default will be used."
  type        = string
  default     = null
}

variable "file_defaults" {
  description = "Default owner and permissions for files."
  type = object({
    owner       = string
    permissions = string
  })
  default = {
    owner       = "root"
    permissions = "0644"
  }
}

variable "files" {
  description = "Map of extra files to create on the instance, path as key. Owner and permissions will use defaults if null."
  type = map(object({
    content     = string
    owner       = string
    permissions = string
  }))
  default = {}
}

variable "allow" {
  description = "List of domains Squid will allow connections to."
  type        = list(string)
  default     = []
}

variable "deny" {
  description = "List of domains Squid will deny connections to."
  type        = list(string)
  default     = []
}

variable "clients" {
  description = "List of CIDR ranges from which Squid will allow connections."
  type        = list(string)
  default     = []
}

variable "default_action" {
  description = "Default action for domains not matching neither the allow or deny lists."
  type        = string
  default     = "deny"
  validation {
    condition     = var.default_action == "deny" || var.default_action == "allow"
    error_message = "Default action must be allow or deny."
  }
}

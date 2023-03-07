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

variable "boot_commands" {
  description = "List of cloud-init `bootcmd`s."
  type        = list(string)
  default     = []
}

variable "cloud_config" {
  description = "Cloud config template path. If provided, takes precedence over all other arguments."
  type        = string
  default     = null
}

variable "config_variables" {
  description = "Additional variables used to render the template passed via `cloud_config`."
  type        = map(any)
  default     = {}
}

variable "container_args" {
  description = "Arguments for container."
  type        = string
  default     = ""
}


variable "container_image" {
  description = "Container image."
  type        = string
}

variable "container_name" {
  description = "Name of the container to be run."
  type        = string
  default     = "container"
}

variable "container_volumes" {
  description = "List of volumes."
  type = list(object({
    host      = string,
    container = string
  }))
  default = []
}

variable "docker_args" {
  description = "Extra arguments to be passed for docker."
  type        = string
  default     = null
}

variable "docker_logging" {
  description = "Log via the Docker gcplogs driver. Disable if you use the legacy Logging Agent instead."
  type        = bool
  default     = true
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

variable "gcp_logging" {
  description = "Should container logs be sent to Google Cloud Logging."
  type        = bool
  default     = true
}

variable "run_commands" {
  description = "List of cloud-init `runcmd`s."
  type        = list(string)
  default     = []
}

variable "users" {
  description = "List of usernames to be created. If provided, first user will be used to run the container."
  type = list(object({
    username = string,
    uid      = number,
  }))
  default = [
  ]
}

variable "run_as_first_user" {
  description = "Run as the first user if users are specified."
  type        = bool
  default     = true
}

variable "authenticate_gcr" {
  description = "Setup docker to pull images from private GCR. Requires at least one user since the token is stored in the home of the first user defined."
  type        = bool
  default     = false
}

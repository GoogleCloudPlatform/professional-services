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
  description = "Additional variables used to render the cloud-config and Nginx templates."
  type        = map(any)
  default     = {}
}

variable "docker_logging" {
  description = "Log via the Docker gcplogs driver. Disable if you use the legacy Logging Agent instead."
  type        = bool
  default     = true
}

variable "image" {
  description = "Nginx container image."
  type        = string
  default     = "nginxdemos/hello:plain-text"
}

variable "nginx_config" {
  description = "Nginx configuration path, if null container default will be used."
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

variable "runcmd_pre" {
  description = "Extra commands to run before starting nginx."
  type        = list(string)
  default     = []
}

variable "runcmd_post" {
  description = "Extra commands to run after starting nginx."
  type        = list(string)
  default     = []
}

variable "users" {
  description = "List of additional usernames to be created."
  type = list(object({
    username = string,
    uid      = number,
  }))
  default = [
  ]
}

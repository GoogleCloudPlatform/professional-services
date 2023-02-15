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
  description = "Additional variables used to render the cloud-config template."
  type        = map(any)
  default     = {}
}

variable "docker_logging" {
  description = "Log via the Docker gcplogs driver. Disable if you use the legacy Logging Agent instead."
  type        = bool
  default     = true
}

variable "image" {
  description = "MySQL container image."
  type        = string
  default     = "mysql:5.7"
}

variable "kms_config" {
  description = "Optional KMS configuration to decrypt passed-in password. Leave null if a plaintext password is used."
  type = object({
    project_id = string
    keyring    = string
    location   = string
    key        = string
  })
  default = null
}

variable "mysql_config" {
  description = "MySQL configuration file content, if null container default will be used."
  type        = string
  default     = null
}

variable "mysql_data_disk" {
  description = "MySQL data disk name in /dev/disk/by-id/ including the google- prefix. If null the boot disk will be used for data."
  type        = string
  default     = null
}

variable "mysql_password" {
  description = "MySQL root password. If an encrypted password is set, use the kms_config variable to specify KMS configuration."
  type        = string
}

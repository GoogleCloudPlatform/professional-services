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

variable "config_directories" {
  description = "List of paths to folders where firewall configs are stored in yaml format. Folder may include subfolders with configuration files. Files suffix must be `.yaml`."
  type        = list(string)
}

variable "log_config" {
  description = "Log configuration. Possible values for `metadata` are `EXCLUDE_ALL_METADATA` and `INCLUDE_ALL_METADATA`. Set to `null` for disabling firewall logging."
  type = object({
    metadata = string
  })
  default = null
}

variable "network" {
  description = "Name of the network this set of firewall rules applies to."
  type        = string
}

variable "project_id" {
  description = "Project Id."
  type        = string
}

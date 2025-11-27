/**
 * Copyright 2025 Google LLC
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

variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "target_url" {
  type = string
}

variable "schedule" {
  type    = string
  default = "* * * * *"
}

variable "crl_expiration_buffer" {
  type    = string
  default = "3600s" # 1 hour default
}

variable "name" {
  type = string
}

variable "alert_autoclose" {
  type    = string
  default = "1800s"
}

variable "proxy_url" {
  description = "Optional proxy URL to use for curl"
  type        = string
  default     = ""
}

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

variable "project_id" {
    type = string
}

variable "location" {
  type = string
}

variable "name" {
  type = string
}

variable "tier" {
  type = string
  default = "ENTERPRISE"
}

variable "type" {
  type = string
  default = "SELF_SIGNED"
}

variable "cert_managers" {
  type = list(string)
  default = []
}

variable "cert_requesters" {
  type = list(string)
  default = []
}

variable "workload_cert_requesters" {
  type = list(string)
  default = []
}

variable "cert_auditors" {
  type = list(string)
  default = []
}

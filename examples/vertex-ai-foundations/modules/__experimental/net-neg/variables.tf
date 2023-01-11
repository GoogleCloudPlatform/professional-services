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

variable "project_id" {
  description = "NEG project id."
  type        = string
}

variable "name" {
  description = "NEG name."
  type        = string
}

variable "network" {
  description = "Name or self link of the VPC used for the NEG. Use the self link for Shared VPC."
  type        = string
}

variable "subnetwork" {
  description = "VPC subnetwork name or self link."
  type        = string
}

variable "zone" {
  description = "NEG zone."
  type        = string
}

variable "endpoints" {
  description = "List of (instance, port, address) of the NEG."
  type = list(object({
    instance   = string
    port       = number
    ip_address = string
  }))
}

/**
 * Copyright 2024 Google LLC
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
  default = "europe-west3"
}

variable "lb_name" {
  type = string
  default = "l4-rilb-mig"
}

variable "lb_port" {
  type = number
  default = 8080
}

variable "lb_proto" {
  type = string
  default = "http"
}

variable "network_id" {
  type = string
}

variable "subnetwork_id" {
  type = string
}

variable "image" {
  type = string
}

variable "additional_metadata" {
  type        = map(any)
  description = "Additional metadata to attach to the instance"
  default     = {}
}

variable "mig_instance_group" {
  type = string
}

/**
 * Copyright 2021 Google LLC
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


variable "name" {
  description = "Base name of the GCE VM."
  type        = string
}

variable "network" {
  description = "GCE VM network."
  type        = string
}

variable "labels" {
  type        = map(any)
  description = "Labels on the vm"
  default = {
    env = "dev"
    app = "business-unit1"
  }
}

variable "machine_type" {
  type        = string
  description = "The machine type to create."
  default     = "e2-medium"
}

variable "zone" {
  type        = string
  description = "Zone where the instances should be created. If not specified, instances will be spread across available zones in the region."
  default     = "us-central1-a"
}

variable "project" {
  description = "The project id"
  type        = string
}

variable "service_account" {
  description = "SA attached to the VM"
  type        = string
}




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
  description = "The ID of the project where this VPC will be created."
  type        = string
}

variable "name" {
  description = "Name of the resources created."
  type        = string
}

variable "region" {
  description = "Region where resources will be created."
  type        = string
}

variable "zone" {
  description = "Zone where resources will be created."
  type        = string
}

variable "network" {
  description = "Producer network id."
  type        = string
}

variable "subnet" {
  description = "Subnetwork id where resources will be associated."
  type        = string
}

variable "subnet_proxy" {
  description = "L7 Regional load balancing subnet id."
  type        = string
}

variable "subnets_psc" {
  description = "PSC NAT subnets."
  type        = list(string)
}

variable "dest_ip_address" {
  description = "On-prem service destination IP address."
  type        = string
}

variable "dest_port" {
  description = "On-prem service destination port."
  type        = string
  default     = "80"
}

variable "accepted_limits" {
  description = "Incoming accepted projects with endpoints limit."
  type        = map(number)
}

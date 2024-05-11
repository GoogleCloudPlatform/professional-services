# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

variable "project_id" {
  type        = string
  description = "Project ID."
}

variable "region" {
  type        = string
  description = "GCP Region to host resources."
}

variable "redis_host_name" {
  type        = string
  description = "Redis host name."

}

variable "redis_distribution_policy_zones" {
  type        = list(string)
  description = "Distribution policy zones for Redis cluster."
}

variable "redis_service_account_name" {
  type        = string
  description = "Service Account name for Redis cluster."
}

variable "redis_subnetwork" {
  type        = string
  description = "Subnetwork fully-qualified link for Redis cluster."
}

variable "consul_instance_group_id" {
  type        = string
  description = "Instance group ID for Consul."
}

variable "consul_network" {
  type        = string
  description = "VPC fully-qualified link for Consul cluster."
}

variable "consul_subnetwork" {
  type        = string
  description = "Subnetwork fully-qualified link for Consul cluster."

}

variable "consul_lb_static_ip" {
  type        = string
  description = "Static IP for Consul Load Balancer."
}

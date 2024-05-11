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

variable "region" {
  type    = string
  default = "asia-south1"
  description = "GCP region name, example (asia-south1)"
}

variable "instance_group_id" {
  type    = string
  description = "instance group id with full path."
}

variable "project_id" {
  type    = string
  description = "GCP project id to create all resources."
}

variable "subnet" {
  type    = string
  description = "subnet id with full path."
}

variable "network" {
  type    = string
  description = "Network id with full path."
}

variable "static_ip" {
  type    = string
  description = "Static ip from var.subnet range"
}

variable "dns_fr_zone_name" {
  type    = string
  default = "consul-fr-zone"
  description = "dns forwarding zone name"
}

variable "override_dns_name" {
  type    = string
  default = ""
  description = "Override the default (region.consul) dns name only if override_dns_name is passed"
}
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

variable "project_id" {
  description = "Project ID"
  type        = string
}

variable "backend_a_project_id" {
  description = "Project ID for backend a project"
  type        = string
}

variable "region" {
  description = "region"
}

variable "gcp-org-id" {
  type = string
}

variable "gcp-billing-id" {
  type = string
}

variable "cidr_mask" {
  type = number
}
 
variable "backend_a_vpc" {
  type = string
}

variable "router_asn" {
  type = number
}

variable "private_zone_domain" {
  type = string
}

variable "peering_zone_domain_a" {
  type = string
}

variable "forwarding_server_1" {
  type = string
}
# data "google_project" "project" {}

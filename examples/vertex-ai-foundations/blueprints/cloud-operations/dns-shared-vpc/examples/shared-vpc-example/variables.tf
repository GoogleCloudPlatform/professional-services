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

variable "host_project" {
  description = "Host project name."
  default     = "host"
}

variable "service_projects" {
  description = "List of service project names."
  type        = list(any)
  default = [
    "app-team1",
    "app-team2",
  ]
}

variable "region" {
  description = "Region in which to create the subnet."
  default     = "europe-west1"
}

variable "project_services" {
  description = "Service APIs enabled by default in new projects."
  default = [
    "compute.googleapis.com",
    "dns.googleapis.com",
  ]
}

variable "organization_id" {
  description = "The organization ID."
}

variable "billing_account" {
  description = "The ID of the billing account to associate this project with."
}

variable "prefix" {
  description = "Customer name to use as prefix for resources' naming."
  default     = "test-dns"
}

variable "dns_domain" {
  description = "DNS domain under which each application team DNS domain will be created."
  default     = "prod.internal"
}

variable "teams" {
  description = "List of teams that require their own Cloud DNS instance."
  default     = ["appteam1", "appteam2"]
}

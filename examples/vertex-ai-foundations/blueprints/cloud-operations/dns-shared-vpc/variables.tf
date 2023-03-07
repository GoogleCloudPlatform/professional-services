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

variable "billing_account_id" {
  description = "Billing account associated with the GCP Projects that will be created for each team."
  type        = string
}

variable "dns_domain" {
  description = "DNS domain under which each application team DNS domain will be created."
  type        = string
  default     = "example.org"
}

variable "folder_id" {
  description = "Folder ID in which DNS projects will be created."
  type        = string
}

variable "prefix" {
  description = "Customer name to use as prefix for resources' naming."
  type        = string
  default     = "test-dns"
}

variable "project_services" {
  description = "Service APIs enabled by default."
  type        = list(string)
  default = [
    "compute.googleapis.com",
    "dns.googleapis.com",
  ]
}

variable "shared_vpc_link" {
  description = "Shared VPC self link, used for DNS peering."
  type        = string
}

variable "teams" {
  description = "List of application teams requiring their own Cloud DNS instance."
  type        = list(string)
  default = [
    "team1",
    "team2",
  ]
}

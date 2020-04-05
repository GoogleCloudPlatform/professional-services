/**
 * Copyright 2020 Google LLC
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

variable "region" {
  description = "The region to create the VPC"
}

variable "project_id" {
  description = "The Project ID for Network setup"
}

variable "vpc_name" {
  description = "The name of the VPC to create"
}

variable "is_shared_vpc_host" {
  description = "Set to `true` to share this VPC with other projects. VPC Hosting and Sharing requires additional permissions."
}

variable "mgmt_subnet_name" {
  description = "Name of the Management subnet. Used for administrative access"
  default     = "management"
}

variable "mgmt_subnet_cidr" {
  description = "The Management Subnet's CIDR block"
  default     = "10.10.1.0/24"
}

variable "in_scope_subnet_name" {
  description = "The name of the In Scope Subnet. Put resources that are in scope for compliance here"
  default     = "in-scope"
}

variable "in_scope_subnet_cidr" {
  description = "The In Scope Subnet's CIDR block"
  default     = "10.10.10.0/24"
}

variable "in_scope_pod_ip_range_name" {
  description = "The Name for the Secondary IP range used for In Scope Kubernetes Pods"
  default     = "in-scope-pod-cidr"
}

variable "in_scope_services_ip_range_name" {
  description = "The Name for the Secondary IP range used for In Scope Kubernetes Services"
  default     = "in-scope-services-cidr"
}

variable "out_of_scope_subnet_name" {
  description = "The name of the Out of Scope Subnet. Put resources that don't meet compliance concerns here"
  default     = "out-of-scope"
}

variable "out_of_scope_subnet_cidr" {
  description = "The Out of Scope Subnet's CIDR block"
  default     = "10.10.20.0/24"
}

variable "out_of_scope_pod_ip_range_name" {
  description = "The Name for the Secondary IP range used for Out of Scope Kubernetes Pods"
  default     = "out-of-scope-pod-cidr"
}

variable "out_of_scope_services_ip_range_name" {
  description = "The Name for the Secondary IP range used for Out of Scope Kubernetes Services"
  default     = "out-of-scope-services-cidr"
}

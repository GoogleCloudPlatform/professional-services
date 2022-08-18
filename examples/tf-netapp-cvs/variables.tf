# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


variable "project_id" {
  description = "The GCP project you want to manage"
  type        = string
}

variable "apis" {
  description = "The list of APIs to be enabled"
  type        = list(any)
}

variable "region" {
  description = "The GCP region for NFS volumes"
  type        = string
  default     = "us-west2"
}

variable "allowed_clients" {
  description = "The GCP region for NFS volumes"
  type        = string
  default     = "172.16.2.0/24"
}

variable "network_name" {
  description = "VPC Network name"
  type        = string
  default     = "custom-vpc-1"
}

variable "service_level" {
  description = "The performance of the service level of volume. Must be one of \"standard\", \"premium\", \"extreme\", default is \"premium\"."
  type        = string
  default     = "premium"
}

variable "nfs-volumes" {
  description = "NFS Volumes to create."
  type        = any
  default     = {}
}
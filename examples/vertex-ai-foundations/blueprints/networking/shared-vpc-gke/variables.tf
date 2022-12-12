# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

variable "billing_account_id" {
  description = "Billing account id used as default for new projects."
  type        = string
}

variable "cluster_create" {
  description = "Create GKE cluster and nodepool."
  type        = bool
  default     = true
}

variable "ip_ranges" {
  description = "Subnet IP CIDR ranges."
  type        = map(string)
  default = {
    gce = "10.0.16.0/24"
    gke = "10.0.32.0/24"
  }
}

variable "ip_secondary_ranges" {
  description = "Secondary IP CIDR ranges."
  type        = map(string)
  default = {
    gke-pods     = "10.128.0.0/18"
    gke-services = "172.16.0.0/24"
  }
}

variable "owners_gce" {
  description = "GCE project owners, in IAM format."
  type        = list(string)
  default     = []
}

variable "owners_gke" {
  description = "GKE project owners, in IAM format."
  type        = list(string)
  default     = []
}

variable "owners_host" {
  description = "Host project owners, in IAM format."
  type        = list(string)
  default     = []
}

variable "prefix" {
  description = "Prefix used for resources that need unique names."
  type        = string
}

variable "private_service_ranges" {
  description = "Private service IP CIDR ranges."
  type        = map(string)
  default = {
    cluster-1 = "192.168.0.0/28"
  }
}

variable "project_services" {
  description = "Service APIs enabled by default in new projects."
  type        = list(string)
  default = [
    "container.googleapis.com",
    "stackdriver.googleapis.com",
  ]
}

variable "region" {
  description = "Region used."
  type        = string
  default     = "europe-west1"
}

variable "root_node" {
  description = "Hierarchy node where projects will be created, 'organizations/org_id' or 'folders/folder_id'."
  type        = string
}

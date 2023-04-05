# Copyright 2023 Google LLC All Rights Reserved.
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

### Project Variables ###

variable "project-id" {
  type        = string
  description = "GCP Project Name"
}

variable "location" {
  type        = string
  description = "The Google Cloud region in which the Cluster will be created and in which the Kubernetes control plane for the Cluster will be provisioned"
}

variable "cluster-ipv4-cidr" {
  type        = string
  description = "The Google Cloud region in which the Cluster will be created and in which the Kubernetes control plane for the Cluster will be provisioned"
}

variable "service-ipv4-cidr" {
  description = "The desired IPv4 CIDR block for Kubernetes Services running on this Cluster"
  type = string
}

variable "node-location" {
  description = "The name of the target Distributed Cloud Edge Zone"
  type = string
}

variable "node-count" {
  description = "The number of Nodes that this NodePool will hold"
  type = number
}

variable "vpc-network-name" {
  description = "The name of the target VPC network to which this VPN Connection will point"
  type = string
}

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

variable "cluster-name" {
  description = "Unique name that identifies this Cluster"
  type = string
}

variable "project-id" {
  description = "The ID of the target Google Cloud project"
  type = string
}

variable "location" {
  description = "The Google Cloud region in which the Cluster will be created and in which the Kubernetes control plane for the Cluster will be provisioned"
  type = string
}

variable "cluster-ipv4-cidr" {
  description = "The desired IPv4 CIDR block for Kubernetes Pods running on this Cluster"
  type = string
}

variable "service-ipv4-cidr" {
  description = "The desired IPv4 CIDR block for Kubernetes Services running on this Cluster"
  type = string
}

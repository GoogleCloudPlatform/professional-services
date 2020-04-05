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

variable "project_id" {}
variable "region" {
  default = "us-central1"
}
variable "mgmt_subnet_cidr" {
  default = "10.10.1.0/24"
}
variable "in_scope_subnet_cidr" {
  default = "10.10.10.0/24"
}
variable "out_of_scope_subnet_cidr" {
  default = "10.10.20.0/24"
}
variable "cluster_location" {
  default = "us-central1-a"
}
variable "node_locations" {
  default = ["us-central1-b"]
}
variable "gke_minimum_version" {
  default = "1.14.10-gke.27"
}

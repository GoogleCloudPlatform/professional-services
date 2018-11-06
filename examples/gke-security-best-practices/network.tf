# Copyright 2018 Google LLC
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

/*
  This file manages GCP Network resources for the cluster
*/

//create a dedicate network for our cluster
resource "google_compute_network" "acme-cluster" {
  name                    = "${var.network_name}"
  auto_create_subnetworks = "${var.auto_create_subnetworks}"

  //^^ disable auto-created subnets to prevent "overlap"
}

//create a dedicated subnet for our cluster
resource "google_compute_subnetwork" "acme-cluster" {
  name                     = "${var.network_name}"
  ip_cidr_range            = "${var.ip_cidr_range}"
  network                  = "${google_compute_network.acme-cluster.self_link}"
  region                   = "${var.region}"
  private_ip_google_access = "${var.private_ip_google_access}"

  //Enable secondary IP range for pods and services:
  secondary_ip_range = [
    {
      range_name    = "${var.network_name}-pods"
      ip_cidr_range = "${var.pods_ip_cidr_range}"
    },
    {
      range_name    = "${var.network_name}-services"
      ip_cidr_range = "${var.services_ip_cidr_range}"
    },
  ]
}

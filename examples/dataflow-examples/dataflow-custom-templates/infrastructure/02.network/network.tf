# Copyright 2022 Google LLC
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

// Provision virtual custom network
resource "google_compute_network" "default" {
  name                    = "data-pipelines"
  auto_create_subnetworks = false
}

// Provision subnetwork of the virtual custom network
resource "google_compute_subnetwork" "default" {
  name                     = "data-pipelines"
  ip_cidr_range            = var.subnetwork_cidr_range
  network                  = google_compute_network.default.name
  private_ip_google_access = true
  region                   = var.region
}

// Provision firewall rule for internal network traffic only
resource "google_compute_firewall" "default" {
  name    = "allow-data-pipelines-internal"
  network = google_compute_network.default.name

  allow {
    protocol = "tcp"
  }
  source_tags = ["dataflow"]
}

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

// For security, we run data pipelines using Compute Engine instances
// with private IP addresses.  The Python Dataflow templates need to
// connect to outside network resources.  Therefore, we need to provision
// a Cloud NAT and router.
resource "google_compute_router" "default" {
  name    = "data-pipelines-nat"
  network = google_compute_network.default.id
  region  = var.region
}

// For security, we run data pipelines using Compute Engine instances
// with private IP addresses.  The Python Dataflow templates need to
// connect to outside network resources.  Therefore, we need to provision
// a Cloud NAT and router.
resource "google_compute_router_nat" "default" {
  name                               = "data-pipelines-nat"
  nat_ip_allocate_option             = "AUTO_ONLY"
  region                             = google_compute_router.default.region
  router                             = google_compute_router.default.name
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
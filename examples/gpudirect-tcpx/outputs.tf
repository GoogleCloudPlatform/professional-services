# Copyright 2024 Google LLC
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

locals {
  networks = {
    management = google_compute_network.gpu_management_plane
    data_plane = google_compute_network.gpu_data_plane
  }
  subnetworks = {
    management = google_compute_subnetwork.gpu_management_plane
    data_plane = google_compute_subnetwork.gpu_data_plane
  }
  firewall_rules = {
    management = [google_compute_firewall.gpu_management_plane-allow-all, google_compute_firewall.gpu_management_plane-allow-icmp]
    data_plane = [google_compute_firewall.gpu_data_plane]
  }
}

output "networks" {
  value = local.networks
}

output "subnetworks" {
  value = local.subnetworks
}

output "firewall_rules" {
  value = local.firewall_rules
}
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

resource "random_id" "gpu_data_plane" {
  byte_length = 2
}

locals {
  data_planes = {
    "one" : "192.168.1.0/24",
    "two" : "192.168.2.0/24",
    "three" : "192.168.3.0/24",
    "four" : "192.168.4.0/24"
  }
}

resource "google_compute_network" "gpu_data_plane" {
  for_each                = local.data_planes
  project                 = var.project_id
  name                    = "gpu-data-plane-${each.key}-${random_id.gpu_data_plane.hex}"
  auto_create_subnetworks = false
  mtu                     = 8244
}

resource "google_compute_subnetwork" "gpu_data_plane" {
  for_each      = local.data_planes
  project       = var.project_id
  name          = "gpu-data-plane-${each.key}-${random_id.gpu_data_plane.hex}"
  region        = var.region
  network       = google_compute_network.gpu_data_plane[each.key].id
  ip_cidr_range = each.value
}

resource "google_compute_firewall" "gpu_data_plane" {
  for_each  = local.data_planes
  name      = "gpu-dataplane-firewall-${each.key}"
  project   = var.project_id
  network   = google_compute_network.gpu_data_plane[each.key].name
  direction = "INGRESS"


  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  source_ranges = ["192.168.0.0/16"]
}
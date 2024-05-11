# Copyright 2024 Google LLC
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

resource "google_compute_firewall" "fw_dns" {
  name          = "consul-l4-ilb-allow-dns-fr"
  description   = "Allow traffic from dns forwarding zone for udp and tcp protocol"
  direction     = "INGRESS"
  network       = var.network
  source_ranges = ["35.199.192.0/19"]

  allow {
    protocol = "udp"
    ports    = ["53"]
  }

  allow {
    protocol = "tcp"
    ports    = ["53"]
  }
}

resource "google_compute_firewall" "fw_hc" {
  name          = "consul-l4-ilb-allow-hc"
  description   = "Allow GCP health check IP's."
  direction     = "INGRESS"
  network       = var.network
  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
  allow {
    protocol = "TCP"
    ports    = ["8500"]
  }
}

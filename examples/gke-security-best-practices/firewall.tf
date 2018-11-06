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
  This file manages firewall resources
*/

//bastion firewall rule: all SSH from provided source network
resource "google_compute_firewall" "bastion-acme-dev-gke-ssh" {
  name    = "${var.ssh_firewall_rule_name}-allow-bastion-ssh"
  network = "${google_compute_subnetwork.acme-cluster.name}"

  target_service_accounts = ["${google_service_account.gke-acme-dev-bastion-svc-account.email}"]
  source_ranges           = "${var.ssh_source_ranges}"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}


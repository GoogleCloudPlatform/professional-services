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

################################################
# Firewall rules for VPC 3
################################################

resource "google_compute_firewall" "ports-15017-9443-vpc3" {
  name          = "${var.prefix}-ports-15017-9443-vpc3"
  project       = var.project_id
  #network       = google_compute_network.asm-vpc-3.name
  network       = data.google_compute_network.asm-vpc-3.name
  source_ranges = [local.cluster3_master_ipv4_cidr_block, local.cluster4_master_ipv4_cidr_block]
  target_tags = [
    local.cluster3_network_tag,
    local.cluster4_network_tag
  ]
  allow {
    protocol = "tcp"
    ports    = [15017, 9443]
  }
}

# required for the policy controller admission webhook
resource "google_compute_firewall" "ports-8443-vpc3" {
  name          = "${var.prefix}-ports-8443-vpc3"
  project       = var.project_id
  #network       = google_compute_network.asm-vpc-3.name
  network       = data.google_compute_network.asm-vpc-3.name
  source_ranges = [local.cluster3_master_ipv4_cidr_block, local.cluster4_master_ipv4_cidr_block]
  target_tags = [
    local.cluster3_network_tag,
    local.cluster4_network_tag
  ]
  allow {
    protocol = "tcp"
    ports    = [8443]
  }
}

# Allow traffic for all CIDR ranges within this VPC
# required for the policy controller admission webhook
resource "google_compute_firewall" "gce-to-vpc3-clusters-all" {
  name          = "${var.prefix}-gce-to-vpc3-clusters-all"
  project       = var.project_id
  #network       = google_compute_network.asm-vpc-3.name
  network       = data.google_compute_network.asm-vpc-3.name
  source_ranges = [local.bastion_cidr]
  target_tags = [
    local.cluster3_network_tag,
    local.cluster4_network_tag
  ]
  allow {
    protocol = "tcp"
  }
}


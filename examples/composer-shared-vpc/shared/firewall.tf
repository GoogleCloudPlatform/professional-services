/**
 * Copyright 2022 Google LLC
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

data "google_netblock_ip_ranges" "private_googleapis" {
  range_type = "private-googleapis"
}

/****************************************
Create deny all egress firewall rule
****************************************/
resource "google_compute_firewall" "deny_all_egress" {
  count     = var.deny_all_egrees_rule_create ? 1 : 0
  name      = "fw-shared-base-65535-e-d-all-all-all"
  network   = module.network.network_name
  project   = module.project-networking.project_id
  direction = "EGRESS"
  priority  = 65535

  log_config {
    metadata = "INCLUDE_ALL_METADATA"
  }

  deny {
    protocol = "all"
  }

  destination_ranges = ["0.0.0.0/0"]
}

/*************************************
Create Egress firewall rule to allow 
private google access from GKE Nodes
***************************************/
resource "google_compute_firewall" "allow_private_api_egress" {
  count     = var.deny_all_egrees_rule_create ? 1 : 0
  name      = "fw-shared-base-65534-e-a-allow-google-apis-all-tcp-443"
  network   = module.network.network_name
  project   = module.project-networking.project_id
  direction = "EGRESS"
  priority  = 65534

  log_config {
    metadata = "INCLUDE_ALL_METADATA"
  }

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  destination_ranges = concat(data.google_netblock_ip_ranges.private_googleapis.cidr_blocks_ipv4)
  target_tags        = var.composer_worker_tags
}


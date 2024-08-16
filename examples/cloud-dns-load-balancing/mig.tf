/**
 * Copyright 2024 Google LLC
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

module "mig-l4" {
  for_each      = var.locations
  source        = "./modules/mig"
  project_id    = var.project_id
  location      = each.key
  network_id    = data.google_compute_network.lb_network.id
  subnetwork_id = data.google_compute_subnetwork.lb_subnetwork[each.key].id
  name          = "failover-l4-${each.key}"
  image         = var.image
}

module "mig-l7" {
  for_each      = var.locations
  source        = "./modules/mig"
  project_id    = var.project_id
  location      = each.key
  network_id    = data.google_compute_network.lb_network.id
  subnetwork_id = data.google_compute_subnetwork.lb_subnetwork[each.key].id
  name          = "failover-l7-${each.key}"
  image         = var.image
}

# Additional firewall rule to allow traffic from the L7 RILB proxy subnetwork to the MIG VMs
resource "google_compute_firewall" "mig-ilb-fw" {
  for_each      = var.locations
  project       = var.project_id
  name          = "mig-fw-allow-proxies-${each.key}"
  network       = data.google_compute_network.lb_network.name

  allow {
    protocol = "tcp"
    ports    = [ "80", "443", "8080" ]
  }

  source_ranges           = [ google_compute_subnetwork.proxy_subnetwork[each.key].ip_cidr_range ]
  target_tags             = ["container-vm-test-mig"]
}

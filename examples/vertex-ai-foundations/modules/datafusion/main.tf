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

locals {
  prefix_length = 22
  ip_allocation = (
    var.ip_allocation_create
    ? "${google_compute_global_address.default[0].address}/${local.prefix_length}"
    : var.ip_allocation
  )
  tenant_project = regex(
    "cloud-datafusion-management-sa@([\\w-]+).iam.gserviceaccount.com",
    google_data_fusion_instance.default.service_account
  )[0]
}

resource "google_compute_global_address" "default" {
  count         = var.ip_allocation_create ? 1 : 0
  project       = var.project_id
  name          = "cdf-${var.name}"
  address_type  = "INTERNAL"
  purpose       = "VPC_PEERING"
  prefix_length = local.prefix_length
  network       = var.network
}

resource "google_compute_network_peering" "default" {
  count                = var.network_peering == true ? 1 : 0
  name                 = "cdf-${var.name}"
  network              = "projects/${var.project_id}/global/networks/${var.network}"
  peer_network         = "projects/${local.tenant_project}/global/networks/${var.region}-${google_data_fusion_instance.default.name}"
  export_custom_routes = true
  import_custom_routes = true
}

resource "google_compute_firewall" "default" {
  count         = var.firewall_create == true ? 1 : 0
  name          = "${var.name}-allow-ssh"
  project       = var.project_id
  network       = var.network
  source_ranges = [local.ip_allocation]
  target_tags   = ["${var.name}-allow-ssh"]

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

resource "google_data_fusion_instance" "default" {
  provider                      = google-beta
  project                       = var.project_id
  name                          = var.name
  type                          = var.type
  description                   = var.description
  labels                        = var.labels
  region                        = var.region
  private_instance              = var.private_instance
  enable_stackdriver_logging    = var.enable_stackdriver_logging
  enable_stackdriver_monitoring = var.enable_stackdriver_monitoring
  network_config {
    network       = var.network
    ip_allocation = local.ip_allocation
  }
}


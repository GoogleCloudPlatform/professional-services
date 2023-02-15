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

# tfdoc:file:description Optional default rule resources.

locals {
  default_rules = {
    for k, v in var.default_rules_config :
    k => var.default_rules_config.disabled == true || v == null ? [] : v
    if k != "disabled"
  }
}

resource "google_compute_firewall" "allow-admins" {
  count         = length(local.default_rules.admin_ranges) > 0 ? 1 : 0
  name          = "${var.network}-ingress-admins"
  description   = "Access from the admin subnet to all subnets."
  network       = var.network
  project       = var.project_id
  source_ranges = local.default_rules.admin_ranges
  allow { protocol = "all" }
}

resource "google_compute_firewall" "allow-tag-http" {
  count         = length(local.default_rules.http_ranges) > 0 ? 1 : 0
  name          = "${var.network}-ingress-tag-http"
  description   = "Allow http to machines with matching tags."
  network       = var.network
  project       = var.project_id
  source_ranges = local.default_rules.http_ranges
  target_tags   = local.default_rules.http_tags
  allow {
    protocol = "tcp"
    ports    = ["80"]
  }
}

resource "google_compute_firewall" "allow-tag-https" {
  count         = length(local.default_rules.https_ranges) > 0 ? 1 : 0
  name          = "${var.network}-ingress-tag-https"
  description   = "Allow http to machines with matching tags."
  network       = var.network
  project       = var.project_id
  source_ranges = local.default_rules.https_ranges
  target_tags   = local.default_rules.https_tags
  allow {
    protocol = "tcp"
    ports    = ["443"]
  }
}

resource "google_compute_firewall" "allow-tag-ssh" {
  count         = length(local.default_rules.ssh_ranges) > 0 ? 1 : 0
  name          = "${var.network}-ingress-tag-ssh"
  description   = "Allow SSH to machines with matching tags."
  network       = var.network
  project       = var.project_id
  source_ranges = local.default_rules.ssh_ranges
  target_tags   = local.default_rules.ssh_tags
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

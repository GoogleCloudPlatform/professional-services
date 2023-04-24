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

resource "google_compute_firewall" "bootstrap-ssh" {
  name          = "${local.infra_id}-bootstrap-ssh"
  project       = var.host_project.project_id
  network       = var.host_project.vpc_name
  source_ranges = var.allowed_ranges
  target_tags   = [local.tags.bootstrap]
  allow {
    protocol = "tcp"
    ports    = [22]
  }
}

resource "google_compute_firewall" "api" {
  name          = "${local.infra_id}-api"
  project       = var.host_project.project_id
  network       = var.host_project.vpc_name
  source_ranges = var.allowed_ranges
  target_tags   = [local.tags.master]
  allow {
    protocol = "tcp"
    ports    = [6443]
  }
}

resource "google_compute_firewall" "hc" {
  name    = "${local.infra_id}-hc"
  project = var.host_project.project_id
  network = var.host_project.vpc_name
  source_ranges = [
    "35.191.0.0/16", "130.211.0.0/22", "209.85.152.0/22", "209.85.204.0/22"
  ]
  target_tags = [local.tags.master]
  allow {
    protocol = "tcp"
    ports    = [6080, 6443, 22624]
  }
}

resource "google_compute_firewall" "etcd" {
  name        = "${local.infra_id}-etcd"
  project     = var.host_project.project_id
  network     = var.host_project.vpc_name
  source_tags = [local.tags.master]
  target_tags = [local.tags.master]
  allow {
    protocol = "tcp"
    ports    = [2379, 2380]
  }
}

resource "google_compute_firewall" "ctrl-plane" {
  name        = "${local.infra_id}-ctrl-plane"
  project     = var.host_project.project_id
  network     = var.host_project.vpc_name
  source_tags = [local.tags.master, local.tags.worker]
  target_tags = [local.tags.master]
  allow {
    protocol = "tcp"
    ports    = [10257, 10259, 22623]
  }
}

resource "google_compute_firewall" "internal-net" {
  name          = "${local.infra_id}-internal-net"
  project       = var.host_project.project_id
  network       = var.host_project.vpc_name
  source_ranges = [var.install_config_params.network.machine]
  target_tags   = [local.tags.master, local.tags.worker]
  allow {
    protocol = "icmp"
  }
  allow {
    protocol = "tcp"
    ports    = [22]
  }
}

resource "google_compute_firewall" "internal-cluster" {
  name        = "${local.infra_id}-internal-cluster"
  project     = var.host_project.project_id
  network     = var.host_project.vpc_name
  source_tags = [local.tags.master, local.tags.worker]
  target_tags = [local.tags.master, local.tags.worker]
  allow {
    protocol = "esp"
  }
  allow {
    protocol = "tcp"
    ports    = ["9000-9999", 10250, "30000-32767"]
  }
  allow {
    protocol = "udp"
    ports    = [500, 4500, 4789, 6081, "9000-9999", "30000-32767"]
  }
}

resource "google_compute_firewall" "apps-hc" {
  name    = "${local.infra_id}-apps-hc"
  project = var.host_project.project_id
  network = var.host_project.vpc_name
  source_ranges = [
    "35.191.0.0/16", "130.211.0.0/22", "209.85.152.0/22", "209.85.204.0/22"
  ]
  target_tags = [local.tags.worker]
  allow {
    protocol = "tcp"
    ports    = ["30000-32767"]
  }
}

resource "google_compute_firewall" "apps" {
  name          = "${local.infra_id}-apps"
  project       = var.host_project.project_id
  network       = var.host_project.vpc_name
  source_ranges = var.allowed_ranges
  target_tags   = [local.tags.worker]
  allow {
    protocol = "tcp"
    ports    = [80, 443]
  }
}

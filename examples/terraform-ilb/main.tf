# Copyright 2021 Google LLC
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

# VPC
resource "google_compute_network" "default" {
  provider                = google-beta
  project                 = var.project_id
  name                    = "ilb-network"
  auto_create_subnetworks = false
}

# proxy only subnet
resource "google_compute_subnetwork" "proxy" {
  provider      = google-beta
  project       = var.project_id
  name          = "lb"
  ip_cidr_range = var.ranges.proxy
  region        = var.region
  purpose       = "INTERNAL_HTTPS_LOAD_BALANCER"
  role          = "ACTIVE"
  network       = google_compute_network.default.id
}

# backed subnet
resource "google_compute_subnetwork" "default" {
  provider      = google-beta
  project       = var.project_id
  name          = "backend"
  ip_cidr_range = var.ranges.backend
  region        = var.region
  network       = google_compute_network.default.id
}

# forwarding rule
resource "google_compute_forwarding_rule" "default" {
  provider              = google-beta
  project               = var.project_id
  region                = var.region
  depends_on            = [google_compute_subnetwork.proxy]
  name                  = "forwarding-rule"
  ip_protocol           = "TCP"
  load_balancing_scheme = "INTERNAL_MANAGED"
  port_range            = "80"
  target                = google_compute_region_target_http_proxy.default.id
  network               = google_compute_network.default.id
  subnetwork            = google_compute_subnetwork.default.id
  network_tier          = "PREMIUM"
}

# http proxy
resource "google_compute_region_target_http_proxy" "default" {
  provider = google-beta
  project  = var.project_id
  region   = var.region
  name     = "proxy"
  url_map  = google_compute_region_url_map.default.id
}

# url map
resource "google_compute_region_url_map" "default" {
  provider        = google-beta
  project         = var.project_id
  region          = var.region
  name            = "map"
  default_service = google_compute_region_backend_service.default.id
}

# backend service
resource "google_compute_region_backend_service" "default" {
  provider              = google-beta
  project               = var.project_id
  region                = var.region
  protocol              = "HTTP"
  name                  = "backend"
  load_balancing_scheme = "INTERNAL_MANAGED"
  timeout_sec           = 10
  health_checks         = [google_compute_region_health_check.default.id]
  backend {
    group           = google_compute_region_instance_group_manager.mig.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }
}

# instance template
resource "google_compute_instance_template" "instance_template" {
  provider     = google-beta
  project      = var.project_id
  name_prefix  = "mig-template-"
  machine_type = "e2-small"
  tags         = ["http-server"]

  network_interface {
    network    = google_compute_network.default.id
    subnetwork = google_compute_subnetwork.default.id
    access_config {
      # add external ip to fetch packages
    }
  }
  disk {
    source_image = "debian-cloud/debian-10"
    auto_delete  = true
    boot         = true
  }

  # install nginx and serve a simple web page
  metadata = {
    startup-script = <<-EOF1
      #! /bin/bash
      set -euo pipefail

      export DEBIAN_FRONTEND=noninteractive
      apt-get update
      apt-get install -y nginx-light jq

      NAME=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/hostname")
      IP=$(curl -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/ip")
      METADATA=$(curl -f -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/?recursive=True" | jq 'del(.["startup-script"])')

      cat <<EOF > /var/www/html/index.html
      <pre>
      Name: $NAME
      IP: $IP
      Metadata: $METADATA
      </pre>
      EOF
    EOF1
  }
  lifecycle {
    create_before_destroy = true
  }
}

# health check
resource "google_compute_region_health_check" "default" {
  provider = google-beta
  project  = var.project_id
  region   = var.region
  name     = "hc"
  http_health_check {
    port_specification = "USE_SERVING_PORT"
  }
}

# MIG
resource "google_compute_region_instance_group_manager" "mig" {
  provider = google-beta
  project  = var.project_id
  region   = var.region
  name     = "mig"
  version {
    instance_template = google_compute_instance_template.instance_template.id
    name              = "primary"
  }
  base_instance_name = "vm"
  target_size        = 2
}

# allow all access from IAP and health check ranges
resource "google_compute_firewall" "fw-iap" {
  provider      = google-beta
  project       = var.project_id
  name          = "allow-iap-hc"
  direction     = "INGRESS"
  network       = google_compute_network.default.id
  source_ranges = ["130.211.0.0/22", "35.191.0.0/16", "35.235.240.0/20"]
  allow {
    protocol = "tcp"
  }
}

# allow http from proxy subnet to backends
resource "google_compute_firewall" "fw-ilb-to-backends" {
  provider      = google-beta
  project       = var.project_id
  name          = "allow-ilb-to-backends"
  direction     = "INGRESS"
  network       = google_compute_network.default.id
  source_ranges = [var.ranges.proxy]
  target_tags   = ["http-server"]
  allow {
    protocol = "tcp"
    ports    = ["80", "443", "8080"]
  }
}

# test instance
resource "google_compute_instance" "vm-test" {
  provider     = google-beta
  project      = var.project_id
  zone         = "${var.region}-b"
  name         = "vm-test"
  machine_type = "e2-small"
  network_interface {
    network    = google_compute_network.default.id
    subnetwork = google_compute_subnetwork.default.id
  }
  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-10"
    }
  }
}

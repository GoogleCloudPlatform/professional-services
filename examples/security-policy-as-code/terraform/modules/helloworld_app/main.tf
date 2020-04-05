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


resource "google_compute_region_instance_group_manager" "helloworld" {
  name               = "helloworld"
  base_instance_name = "helloworld"
  project            = var.project_id
  region             = var.region

  version {
    instance_template = google_compute_instance_template.helloworld.self_link
  }

  target_size = 2

  named_port {
    name = "http"
    port = 80
  }
}

resource "google_compute_instance_template" "helloworld" {
  name_prefix = "helloworld-template-"
  description = "This template is used to create app server instances."
  project     = var.project_id

  machine_type = "n1-standard-1"
  tags         = ["helloworld"]

  disk {
    source_image = "debian-cloud/debian-9"
    auto_delete  = true
    boot         = true
    disk_encryption_key {
      kms_key_self_link = var.disk_encryption_key
    }
  }
  labels = {
    env = "dev"
  }
  network_interface {
    subnetwork = "projects/${var.network_project_id}/regions/${var.region}/subnetworks/${var.subnetwork_name}"
  }
  metadata_startup_script = file("${path.module}/startup.sh")
  metadata = {
    enable-oslogin           = "TRUE"
    serial-port-enable       = 0
    block-project-ssh-keys   = true
    disable-legacy-endpoints = true
  }
  lifecycle {
    create_before_destroy = true
  }
  service_account {
    email = var.service_account_email
    scopes = [
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/trace.append",
      "https://www.googleapis.com/auth/service.management.readonly",
      "https://www.googleapis.com/auth/servicecontrol",
      "https://www.googleapis.com/auth/cloudkms",
      "https://www.googleapis.com/auth/cloud_debugger",
    ]
  }
}

data "google_compute_image" "my_image" {
  family  = "debian-9"
  project = "debian-cloud"
}

resource "google_compute_forwarding_rule" "helloworld" {
  project               = var.project_id
  name                  = "helloworld"
  region                = var.region
  subnetwork            = "projects/${var.network_project_id}/regions/${var.region}/subnetworks/${var.subnetwork_name}"
  load_balancing_scheme = "INTERNAL"
  backend_service       = google_compute_region_backend_service.helloworld.self_link
  ports                 = ["80"]
}

resource "google_compute_region_backend_service" "helloworld" {
  project = var.project_id
  name    = "helloworld"
  region  = var.region

  backend {
    group = google_compute_region_instance_group_manager.helloworld.instance_group
  }
  health_checks = [google_compute_health_check.health_check.self_link]
}

resource "google_compute_health_check" "health_check" {
  project = var.project_id
  name    = "simple-http-health-check"
  http_health_check {
    port = 80
  }
}

resource "google_compute_firewall" "helloworld-egress" {
  name        = "helloworld-egress"
  project     = var.network_project_id
  direction   = "EGRESS"
  priority    = 2000
  network     = var.vpc_name
  description = "CID: SNOW-9999 Allow egress rules for external access"

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  allow {
    protocol = "udp"
    ports    = ["53"]
  }

  destination_ranges = ["0.0.0.0/0"]

}

resource "google_compute_firewall" "helloworld-rules" {
  name        = "helloworld-rules"
  project     = var.network_project_id
  network     = var.vpc_name
  description = "CID: SNOW-9999 Allow ingress rules for internal GCP IP address ranges. Necessary for IAP and Healthchecks"

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  // ALLOW from Google Internal IP ranges
  // for Healthchecks and Identity-Aware Proxy
  source_ranges = [
    "35.191.0.0/16",
    "130.211.0.0/22",
    "35.235.240.0/20"
  ]
}


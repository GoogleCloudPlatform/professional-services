/**
 * Copyright 2021 Google LLC
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
 
data "google_project" "project" {
  project_id = var.project
}

resource "random_string" "random" {
  length      = 3
  min_numeric = 3
}

resource "google_compute_instance" "vm" {
  name                      = "${var.name}-${var.environment}-${random_string.random.result}"
  project                   = var.project
  machine_type              = var.machine_type
  zone                      = var.zone
  allow_stopping_for_update = true
  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  network_interface {
    network = var.network

    access_config {
      // Ephemeral public IP
    }
  }

  labels = var.labels
  service_account {
    email  = "${data.google_project.project.number}-compute@developer.gserviceaccount.com"
    scopes = ["cloud-platform"]
  }
}
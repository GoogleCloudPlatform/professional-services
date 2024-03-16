# Copyright 2021 Google LLC
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

# Internal test server to serve HTTP requests from the Cloud Run instance
data "google_compute_default_service_account" "shared-vpc-sa" {
  project = var.shared_vpc_host_project
}

resource "google_compute_instance" "default" {
  project      = var.shared_vpc_host_project
  name         = "webserver"
  machine_type = "e2-micro"
  zone         = "${var.region}-b"

  tags = ["webhook-responder"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  network_interface {
    network    = google_compute_network.shared-vpc-host.self_link
    subnetwork = google_compute_subnetwork.shared-vpc-host-vm.self_link
    network_ip = google_compute_address.example-server-internal-ip.address
  }

  metadata_startup_script = file("data/startup.sh")

  service_account {
    email  = data.google_compute_default_service_account.shared-vpc-sa.email
    scopes = ["cloud-platform"]
  }

  allow_stopping_for_update = true
}
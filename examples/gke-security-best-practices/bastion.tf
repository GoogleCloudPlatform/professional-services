# Copyright 2018 Google LLC
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

/*
  This file manages ssh bastion host resources for the cluster
*/

//Create a bastion host VM to access our GKE cluster
resource "google_compute_instance" "bastion-acme-dev-gke" {
  name         = "bastion-${var.name}-gke"
  machine_type = "${var.machine_type}"
  zone         = "${var.zone}"


  service_account {
    email  = "${google_service_account.gke-acme-dev-bastion-svc-account.email}"
    scopes = "${var.bastion_oath_scopes}"
  }

  // tags = ["foo", "bar"]
  // ^^ apply any tags

  boot_disk {
    initialize_params {
      image = "${var.bastion_image}"
    }
  }
  // Local SSD disk
  scratch_disk {}
  //specify the dedicated subnet for our inside interface:
  network_interface {
    subnetwork = "${google_compute_subnetwork.acme-cluster.name}"

    access_config {
      // leaving it empty assigns: Ephemeral IP
    }
  }

  // set any needed labels
  // metadata {
  //   foo = "bar"
  // }

  //  metadata_startup_script = "echo hi > /test.txt"
}

/*
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

resource "google_compute_instance_template" "data_broker_server_template" {
  name        = "data-broker-server-template"
  description = "This template is used to create the Aurinko data broker server instances."
  project = "${google_project.project.project_id}"

  depends_on = ["google_project_service.compute",
                "google_project_service.gcr",
                "google_project_service.logging"]

  labels = {
    container-vm = "aurinko-data-broker"
  }

  instance_description = "Data Broker Server for Aurinko"
  machine_type         = "n1-standard-1"
  can_ip_forward       = false

  scheduling {
    automatic_restart   = true
    on_host_maintenance = "MIGRATE"
  }

  // Create a new boot disk from an image
  disk {
    source_image = "https://www.googleapis.com/compute/v1/projects/cos-cloud/global/images/cos-stable-67-10575-57-0"
    auto_delete  = true
    boot         = true
  }



  network_interface {
    network = "default",
    access_config = {
    network_tier = "STANDARD"
    }
  }

  metadata {
    gce-container-declaration = <<LONGKEY
      spec:
        containers:
            - name: data-broker-server
              image: gcr.io/${google_project.project.project_id}/data-broker-server
              stdin: false
              tty: false
              restartPolicy: Always
LONGKEY
  }
  service_account {
    scopes = ["cloud-platform"]
  }
}


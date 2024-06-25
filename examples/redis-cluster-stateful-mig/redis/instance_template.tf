# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

data "google_compute_image" "my_image" {
  family  = var.image.family
  project = var.image.project
}

resource "google_compute_instance_template" "redis_instance_template" {
  name_prefix  = "redis-instance-template"
  description  = "Instance template for Redis datastore"
  project      = var.project_id
  machine_type = var.machine_type

  # Boot disk configs
  disk {
    source_image = data.google_compute_image.my_image.self_link
    auto_delete  = true
    boot         = true
  }

  # Boot disk configs
  dynamic "disk" {
    for_each = var.persistent_disk
    content {
      device_name  = disk.value.device_name
      auto_delete  = disk.value.auto_delete
      boot         = disk.value.boot
      disk_size_gb = disk.value.disk_size_gb
    }
  }

  network_interface {
    subnetwork = var.subnetwork
  }

  metadata = {
    startup-script = templatefile("${path.module}/./startup_script.sh", {
      region = var.region
    })
  }

  service_account {
    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
    email  = google_service_account.redis_service_account.email
  }

  # Use create_before_destroy to create a new template before destroying the old one
  lifecycle {
    create_before_destroy = true
  }
}



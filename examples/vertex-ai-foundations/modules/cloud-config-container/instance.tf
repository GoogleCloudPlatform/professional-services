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

resource "google_service_account" "default" {
  count        = var.test_instance == null ? 0 : 1
  project      = var.test_instance.project_id
  account_id   = "fabric-container-${var.test_instance.name}"
  display_name = "Managed by the cos Terraform module."
}

resource "google_project_iam_member" "default" {
  for_each = (
    var.test_instance == null
    ? toset([])
    : toset(var.test_instance_defaults.service_account_roles)
  )
  project = var.test_instance.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.default[0].email}"
}

resource "google_compute_disk" "disks" {
  for_each = (
    var.test_instance == null
    ? {}
    : var.test_instance_defaults.disks
  )
  project = var.test_instance.project_id
  zone    = var.test_instance.zone
  name    = each.key
  type    = "pd-ssd"
  size    = each.value.size
}

resource "google_compute_instance" "default" {
  count       = var.test_instance == null ? 0 : 1
  project     = var.test_instance.project_id
  zone        = var.test_instance.zone
  name        = var.test_instance.name
  description = "Managed by the cos Terraform module."
  tags        = var.test_instance_defaults.tags
  machine_type = (
    var.test_instance.type == null ? "f1-micro" : var.test_instance.type
  )
  metadata = merge(var.test_instance_defaults.metadata, {
    user-data = local.cloud_config
  })

  dynamic "attached_disk" {
    for_each = var.test_instance_defaults.disks
    iterator = disk
    content {
      device_name = disk.key
      mode        = disk.value.read_only ? "READ_ONLY" : "READ_WRITE"
      source      = google_compute_disk.disks[disk.key].name
    }
  }

  boot_disk {
    initialize_params {
      type = "pd-ssd"
      image = (
        var.test_instance_defaults.image == null
        ? "projects/cos-cloud/global/images/family/cos-stable"
        : var.test_instance_defaults.image
      )
      size = 10
    }
  }

  network_interface {
    network    = var.test_instance.network
    subnetwork = var.test_instance.subnetwork
    dynamic "access_config" {
      for_each = var.test_instance_defaults.nat ? [""] : []
      iterator = config
      content {
        nat_ip = null
      }
    }
  }

  service_account {
    email  = google_service_account.default[0].email
    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }

}

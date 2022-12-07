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

resource "google_storage_bucket" "bootstrap-ignition" {
  project       = var.service_project.project_id
  name          = local.infra_id
  location      = var.region
  force_destroy = true
}

resource "google_storage_bucket_object" "bootstrap-ignition" {
  count  = local.bootstrapping ? 1 : 0
  bucket = google_storage_bucket.bootstrap-ignition.name
  name   = "bootstrap.ign"
  source = "${local.fs_paths.config_dir}/bootstrap.ign"
}

data "google_storage_object_signed_url" "bootstrap-ignition" {
  count       = local.bootstrapping ? 1 : 0
  bucket      = google_storage_bucket.bootstrap-ignition.name
  path        = google_storage_bucket_object.bootstrap-ignition.0.name
  credentials = file(local.fs_paths.credentials)
}

resource "google_compute_instance" "bootstrap" {
  count        = local.bootstrapping ? 1 : 0
  project      = var.service_project.project_id
  name         = "${local.infra_id}-b"
  hostname     = "${local.infra_id}-bootstrap.${local.subdomain}"
  machine_type = "n1-standard-4"
  zone         = "${var.region}-${element(var.zones, 0)}"
  network_interface {
    subnetwork         = var.host_project.masters_subnet_name
    subnetwork_project = var.host_project.project_id
  }
  boot_disk {
    initialize_params {
      image = var.rhcos_gcp_image
      size  = 16
      type  = "pd-balanced"
    }
    kms_key_self_link = local.disk_encryption_key
  }
  service_account {
    email  = google_service_account.default["m"].email
    scopes = ["cloud-platform", "userinfo-email"]
  }
  tags = concat(
    [local.tags.bootstrap, local.tags.master, "ocp-master"],
    var.tags == null ? [] : var.tags
  )
  metadata = {
    user-data = jsonencode({
      ignition = {
        config = {
          replace = !local.bootstrapping ? {} : {
            source = data.google_storage_object_signed_url.bootstrap-ignition.0.signed_url
          }
        }
        version = "3.1.0"
      }
    })
    VmDnsSetting = "GlobalDefault"
  }
  labels = var.install_config_params.labels
}

resource "google_compute_instance_group" "bootstrap" {
  project     = var.service_project.project_id
  network     = data.google_compute_network.default.self_link
  zone        = "${var.region}-${var.zones[0]}"
  name        = "${local.infra_id}-bootstrap"
  description = "Openshift bootstrap group for ${local.infra_id}."
  instances   = [for i in google_compute_instance.bootstrap : i.self_link]
  named_port {
    name = "https"
    port = 6443
  }
  named_port {
    name = "ignition"
    port = 22623
  }
}

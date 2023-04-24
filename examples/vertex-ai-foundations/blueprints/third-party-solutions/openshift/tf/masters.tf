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

resource "google_compute_instance" "master" {
  for_each     = toset(var.zones)
  project      = var.service_project.project_id
  name         = "${local.infra_id}-master-${each.key}"
  hostname     = "${local.infra_id}-master-${each.key}.${local.subdomain}"
  machine_type = "n1-standard-4"
  zone         = "${var.region}-${each.key}"
  network_interface {
    subnetwork         = var.host_project.masters_subnet_name
    subnetwork_project = var.host_project.project_id
  }
  boot_disk {
    initialize_params {
      image = var.rhcos_gcp_image
      size  = var.install_config_params.disk_size
      type  = "pd-ssd"
    }
    kms_key_self_link = local.disk_encryption_key
  }
  service_account {
    email  = google_service_account.default["m"].email
    scopes = ["cloud-platform", "userinfo-email"]
  }
  tags = concat(
    [local.tags.master, "ocp-master"],
    var.tags == null ? [] : var.tags
  )
  metadata = {
    user-data    = file("${local.fs_paths.config_dir}/master.ign"),
    VmDnsSetting = "GlobalDefault"
  }
  labels = var.install_config_params.labels
}

resource "google_compute_instance_group" "master" {
  for_each    = toset(var.zones)
  project     = var.service_project.project_id
  network     = data.google_compute_network.default.self_link
  zone        = "${var.region}-${each.key}"
  name        = "${local.infra_id}-master-${each.key}"
  description = "Openshift master group for ${local.infra_id} in zone ${each.key}."
  instances   = [google_compute_instance.master[each.key].self_link]
  named_port {
    name = "https"
    port = 6443
  }
  named_port {
    name = "ignition"
    port = 22623
  }
}

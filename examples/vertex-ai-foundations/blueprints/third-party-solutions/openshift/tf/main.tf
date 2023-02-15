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

locals {
  bootstrapping = var.post_bootstrap_config == null
  cluster_name  = local.install_metadata["clusterName"]
  disk_encryption_key = (
    var.disk_encryption_key == null
    ? null
    : data.google_kms_crypto_key.default.0.id
  )
  fs_paths = { for k, v in var.fs_paths : k => pathexpand(v) }
  infra_id = local.install_metadata["infraID"]
  install_metadata = jsondecode(file(
    "${local.fs_paths.config_dir}/metadata.json"
  ))
  machine_sa     = try(var.post_bootstrap_config.machine_op_sa_prefix, null)
  router_address = try(var.post_bootstrap_config.router_address, null)
  subdomain      = "${var.cluster_name}.${var.domain}"
  tags = {
    for n in ["bootstrap", "master", "worker"] : n => "${local.infra_id}-${n}"
  }
}

data "google_compute_network" "default" {
  project = var.host_project.project_id
  name    = var.host_project.vpc_name
}

data "google_compute_subnetwork" "default" {
  for_each = toset(["default", "masters", "workers"])
  project  = var.host_project.project_id
  region   = var.region
  name     = var.host_project["${each.key}_subnet_name"]
}

data "google_kms_key_ring" "default" {
  count    = var.disk_encryption_key == null ? 0 : 1
  project  = var.disk_encryption_key.project_id
  location = var.disk_encryption_key.location
  name     = var.disk_encryption_key.keyring
}

data "google_kms_crypto_key" "default" {
  count    = var.disk_encryption_key == null ? 0 : 1
  key_ring = data.google_kms_key_ring.default.0.self_link
  name     = var.disk_encryption_key.name
}

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

resource "google_notebooks_instance" "instance" {
  name                   = var.name
  machine_type           = var.machine_type
  location               = var.location
  project                = var.project_id
  post_startup_script    = var.post_startup_script
  instance_owners        = var.instance_owners
  service_account        = var.service_account
  service_account_scopes = var.service_account_scopes
  nic_type               = var.nic_type
  install_gpu_driver     = var.install_gpu_driver
  custom_gpu_driver_path = var.custom_gpu_driver_path
  boot_disk_type         = var.boot_disk_type
  boot_disk_size_gb      = var.boot_disk_size_gb
  data_disk_type         = var.data_disk_type
  data_disk_size_gb      = var.data_disk_size_gb
  no_remove_data_disk    = var.no_remove_data_disk
  disk_encryption        = var.disk_encryption
  kms_key                = var.kms_key
  no_public_ip           = var.no_public_ip
  no_proxy_access        = var.no_proxy_access
  network                = var.network
  subnet                 = var.subnet
  labels                 = var.labels
  metadata               = var.metadata
  dynamic "vm_image" {
    for_each = var.vm_image == null ? [] : [""]
    content {
      project      = var.vm_image.project
      image_family = var.vm_image.image_family
      image_name   = var.vm_image.image_name
    }
  }
  dynamic "container_image" {
    for_each = var.container_image == null ? [] : [""]
    content {
      repository = var.container_image.repository
      tag        = var.container_image.tag
    }
  }
  dynamic "accelerator_config" {
    for_each = var.accelerator_config == null ? [] : [""]
    content {
      type       = var.accelerator_config.type
      core_count = var.accelerator_config.core_count
    }
  }
  dynamic "shielded_instance_config" {
    for_each = var.shielded_instance_config == null ? [] : [""]
    content {
      enable_integrity_monitoring = var.shielded_instance_config.enable_integrity_monitoring
      enable_secure_boot          = var.shielded_instance_config.enable_secure_boot
      enable_vtpm                 = var.shielded_instance_config.enable_vtpm
    }
  }
  dynamic "reservation_affinity" {
    for_each = var.reservation_affinity == null ? [] : [""]
    content {
      consume_reservation_type = var.reservation_affinity.consume_reservation_type
      key                      = var.reservation_affinity.key
      values                   = var.reservation_affinity.values
    }
  }
}
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
  attached_disks = {
    for disk in var.attached_disks :
    disk.name => merge(disk, {
      options = disk.options == null ? var.attached_disk_defaults : disk.options
    })
  }
  attached_disks_regional = {
    for k, v in local.attached_disks :
    k => v if try(v.options.replica_zone, null) != null
  }
  attached_disks_zonal = {
    for k, v in local.attached_disks :
    k => v if try(v.options.replica_zone, null) == null
  }
  on_host_maintenance = (
    var.options.spot || var.confidential_compute
    ? "TERMINATE"
    : "MIGRATE"
  )
  region = join("-", slice(split("-", var.zone), 0, 2))
  service_account_email = (
    var.service_account_create
    ? (
      length(google_service_account.service_account) > 0
      ? google_service_account.service_account[0].email
      : null
    )
    : var.service_account
  )
  service_account_scopes = (
    length(var.service_account_scopes) > 0
    ? var.service_account_scopes
    : (
      var.service_account_create
      ? [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/userinfo.email"
      ]
      : [
        "https://www.googleapis.com/auth/devstorage.read_only",
        "https://www.googleapis.com/auth/logging.write",
        "https://www.googleapis.com/auth/monitoring.write"
      ]
    )
  )
  termination_action = var.options.spot ? coalesce(var.options.termination_action, "STOP") : null
}

resource "google_compute_disk" "disks" {
  for_each = var.create_template ? {} : {
    for k, v in local.attached_disks_zonal :
    k => v if v.source_type != "attach"
  }
  project  = var.project_id
  zone     = var.zone
  name     = "${var.name}-${each.key}"
  type     = each.value.options.type
  size     = each.value.size
  image    = each.value.source_type == "image" ? each.value.source : null
  snapshot = each.value.source_type == "snapshot" ? each.value.source : null
  labels = merge(var.labels, {
    disk_name = each.value.name
    disk_type = each.value.options.type
  })
  dynamic "disk_encryption_key" {
    for_each = var.encryption != null ? [""] : []
    content {
      raw_key           = var.encryption.disk_encryption_key_raw
      kms_key_self_link = var.encryption.kms_key_self_link
    }
  }
}

resource "google_compute_region_disk" "disks" {
  provider = google-beta
  for_each = var.create_template ? {} : {
    for k, v in local.attached_disks_regional :
    k => v if v.source_type != "attach"
  }
  project       = var.project_id
  region        = local.region
  replica_zones = [var.zone, each.value.options.replica_zone]
  name          = "${var.name}-${each.key}"
  type          = each.value.options.type
  size          = each.value.size
  # image         = each.value.source_type == "image" ? each.value.source : null
  snapshot = each.value.source_type == "snapshot" ? each.value.source : null
  labels = merge(var.labels, {
    disk_name = each.value.name
    disk_type = each.value.options.type
  })
  dynamic "disk_encryption_key" {
    for_each = var.encryption != null ? [""] : []
    content {
      raw_key = var.encryption.disk_encryption_key_raw
      # TODO: check if self link works here
      kms_key_name = var.encryption.kms_key_self_link
    }
  }
}

resource "google_compute_instance" "default" {
  provider                  = google-beta
  count                     = var.create_template ? 0 : 1
  project                   = var.project_id
  zone                      = var.zone
  name                      = var.name
  hostname                  = var.hostname
  description               = var.description
  tags                      = var.tags
  machine_type              = var.instance_type
  min_cpu_platform          = var.min_cpu_platform
  can_ip_forward            = var.can_ip_forward
  allow_stopping_for_update = var.options.allow_stopping_for_update
  deletion_protection       = var.options.deletion_protection
  enable_display            = var.enable_display
  labels                    = var.labels
  metadata                  = var.metadata

  dynamic "attached_disk" {
    for_each = local.attached_disks_zonal
    iterator = config
    content {
      device_name = config.value.name
      mode        = config.value.options.mode
      source = (
        config.value.source_type == "attach"
        ? config.value.source
        : google_compute_disk.disks[config.key].name
      )
    }
  }

  dynamic "attached_disk" {
    for_each = local.attached_disks_regional
    iterator = config
    content {
      device_name = config.value.name
      mode        = config.value.options.mode
      source = (
        config.value.source_type == "attach"
        ? config.value.source
        : google_compute_region_disk.disks[config.key].name
      )
    }
  }

  boot_disk {
    auto_delete = var.boot_disk.auto_delete
    initialize_params {
      type  = var.boot_disk.type
      image = var.boot_disk.image
      size  = var.boot_disk.size
    }
    disk_encryption_key_raw = var.encryption != null ? var.encryption.disk_encryption_key_raw : null
    kms_key_self_link       = var.encryption != null ? var.encryption.kms_key_self_link : null
  }

  dynamic "confidential_instance_config" {
    for_each = var.confidential_compute ? [""] : []
    content {
      enable_confidential_compute = true
    }
  }

  dynamic "network_interface" {
    for_each = var.network_interfaces
    iterator = config
    content {
      network    = config.value.network
      subnetwork = config.value.subnetwork
      network_ip = try(config.value.addresses.internal, null)
      dynamic "access_config" {
        for_each = config.value.nat ? [""] : []
        content {
          nat_ip = try(config.value.addresses.external, null)
        }
      }
      dynamic "alias_ip_range" {
        for_each = config.value.alias_ips
        iterator = config_alias
        content {
          subnetwork_range_name = config_alias.key
          ip_cidr_range         = config_alias.value
        }
      }
      nic_type = config.value.nic_type
    }
  }

  scheduling {
    automatic_restart           = !var.options.spot
    instance_termination_action = local.termination_action
    on_host_maintenance         = local.on_host_maintenance
    preemptible                 = var.options.spot
    provisioning_model          = var.options.spot ? "SPOT" : "STANDARD"
  }

  dynamic "scratch_disk" {
    for_each = [
      for i in range(0, var.scratch_disks.count) : var.scratch_disks.interface
    ]
    iterator = config
    content {
      interface = config.value
    }
  }

  service_account {
    email  = local.service_account_email
    scopes = local.service_account_scopes
  }

  dynamic "shielded_instance_config" {
    for_each = var.shielded_config != null ? [var.shielded_config] : []
    iterator = config
    content {
      enable_secure_boot          = config.value.enable_secure_boot
      enable_vtpm                 = config.value.enable_vtpm
      enable_integrity_monitoring = config.value.enable_integrity_monitoring
    }
  }

  # guest_accelerator
}

resource "google_compute_instance_iam_binding" "default" {
  project       = var.project_id
  for_each      = var.iam
  zone          = var.zone
  instance_name = var.name
  role          = each.key
  members       = each.value
  depends_on    = [google_compute_instance.default]
}

resource "google_compute_instance_template" "default" {
  provider         = google-beta
  count            = var.create_template ? 1 : 0
  project          = var.project_id
  region           = local.region
  name_prefix      = "${var.name}-"
  description      = var.description
  tags             = var.tags
  machine_type     = var.instance_type
  min_cpu_platform = var.min_cpu_platform
  can_ip_forward   = var.can_ip_forward
  metadata         = var.metadata
  labels           = var.labels

  disk {
    auto_delete  = var.boot_disk.auto_delete
    boot         = true
    disk_size_gb = var.boot_disk.size
    disk_type    = var.boot_disk.type
    source_image = var.boot_disk.image
  }

  dynamic "confidential_instance_config" {
    for_each = var.confidential_compute ? [""] : []
    content {
      enable_confidential_compute = true
    }
  }

  dynamic "disk" {
    for_each = local.attached_disks
    iterator = config
    content {
      auto_delete = config.value.options.auto_delete
      device_name = config.value.name
      # Cannot use `source` with any of the fields in
      # [disk_size_gb disk_name disk_type source_image labels]
      disk_type = (
        config.value.source_type != "attach" ? config.value.options.type : null
      )
      disk_size_gb = (
        config.value.source_type != "attach" ? config.value.size : null
      )
      mode = config.value.options.mode
      source_image = (
        config.value.source_type == "image" ? config.value.source : null
      )
      source = (
        config.value.source_type == "attach" ? config.value.source : null
      )
      disk_name = (
        config.value.source_type != "attach" ? config.value.name : null
      )
      type = "PERSISTENT"
      dynamic "disk_encryption_key" {
        for_each = var.encryption != null ? [""] : []
        content {
          kms_key_self_link = var.encryption.kms_key_self_link
        }
      }
    }
  }

  dynamic "network_interface" {
    for_each = var.network_interfaces
    iterator = config
    content {
      network    = config.value.network
      subnetwork = config.value.subnetwork
      network_ip = try(config.value.addresses.internal, null)
      dynamic "access_config" {
        for_each = config.value.nat ? [""] : []
        content {
          nat_ip = try(config.value.addresses.external, null)
        }
      }
      dynamic "alias_ip_range" {
        for_each = config.value.alias_ips
        iterator = config_alias
        content {
          subnetwork_range_name = config_alias.key
          ip_cidr_range         = config_alias.value
        }
      }
      nic_type = config.value.nic_type
    }
  }

  scheduling {
    automatic_restart           = !var.options.spot
    instance_termination_action = local.termination_action
    on_host_maintenance         = local.on_host_maintenance
    preemptible                 = var.options.spot
    provisioning_model          = var.options.spot ? "SPOT" : "STANDARD"
  }

  service_account {
    email  = local.service_account_email
    scopes = local.service_account_scopes
  }

  dynamic "shielded_instance_config" {
    for_each = var.shielded_config != null ? [var.shielded_config] : []
    iterator = config
    content {
      enable_secure_boot          = config.value.enable_secure_boot
      enable_vtpm                 = config.value.enable_vtpm
      enable_integrity_monitoring = config.value.enable_integrity_monitoring
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_instance_group" "unmanaged" {
  count   = var.group != null && !var.create_template ? 1 : 0
  project = var.project_id
  network = (
    length(var.network_interfaces) > 0
    ? var.network_interfaces.0.network
    : ""
  )
  zone        = var.zone
  name        = var.name
  description = var.description
  instances   = [google_compute_instance.default.0.self_link]
  dynamic "named_port" {
    for_each = var.group.named_ports != null ? var.group.named_ports : {}
    iterator = config
    content {
      name = config.key
      port = config.value
    }
  }
}

resource "google_service_account" "service_account" {
  count        = var.service_account_create ? 1 : 0
  project      = var.project_id
  account_id   = "tf-vm-${var.name}"
  display_name = "Terraform VM ${var.name}."
}

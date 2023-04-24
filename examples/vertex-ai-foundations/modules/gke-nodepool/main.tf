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
  _image = coalesce(var.node_config.image_type, "-")
  image = {
    is_cos = length(regexall("COS", local._image)) > 0
    is_cos_containerd = (
      var.node_config.image_type == null
      ||
      length(regexall("COS_CONTAINERD", local._image)) > 0
    )
    is_win = length(regexall("WIN", local._image)) > 0
  }
  node_metadata = var.node_config.metadata == null ? null : merge(
    var.node_config.metadata,
    { disable-legacy-endpoints = "true" }
  )
  # if no attributes passed for service account, use the GCE default
  # if no email specified, create service account
  service_account_email = (
    var.service_account.create
    ? google_service_account.service_account[0].email
    : var.service_account.email
  )
  service_account_scopes = (
    var.service_account.oauth_scopes != null
    ? var.service_account.oauth_scopes
    : [
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/monitoring.write",
      "https://www.googleapis.com/auth/userinfo.email"
    ]
  )
  taints_windows = (
    local.image.is_win
    ? [{
      key = "node.kubernetes.io/os", value = "windows", effect = "NO_EXECUTE"
    }]
    : []
  )
}

resource "google_service_account" "service_account" {
  count   = var.service_account.create ? 1 : 0
  project = var.project_id
  account_id = (
    var.service_account.email != null
    ? split("@", var.service_account.email)[0]
    : "tf-gke-${var.name}"
  )
  display_name = "Terraform GKE ${var.cluster_name} ${var.name}."
}

resource "google_container_node_pool" "nodepool" {
  provider           = google-beta
  project            = var.project_id
  cluster            = var.cluster_name
  location           = var.location
  name               = var.name
  version            = var.gke_version
  max_pods_per_node  = var.max_pods_per_node
  initial_node_count = var.node_count.initial
  node_count         = var.node_count.current
  node_locations     = var.node_locations
  # placement_policy   = var.nodepool_config.placement_policy

  dynamic "autoscaling" {
    for_each = (
      try(var.nodepool_config.autoscaling, null) != null
      &&
      !try(var.nodepool_config.autoscaling.use_total_nodes, false)
      ? [""] : []
    )
    content {
      location_policy = try(var.nodepool_config.autoscaling.location_policy, null)
      max_node_count  = try(var.nodepool_config.autoscaling.max_node_count, null)
      min_node_count  = try(var.nodepool_config.autoscaling.min_node_count, null)
    }
  }
  dynamic "autoscaling" {
    for_each = (
      try(var.nodepool_config.autoscaling.use_total_nodes, false) ? [""] : []
    )
    content {
      location_policy      = try(var.nodepool_config.autoscaling.location_policy, null)
      total_max_node_count = try(var.nodepool_config.autoscaling.max_node_count, null)
      total_min_node_count = try(var.nodepool_config.autoscaling.min_node_count, null)
    }
  }

  dynamic "management" {
    for_each = try(var.nodepool_config.management, null) != null ? [""] : []
    content {
      auto_repair  = try(var.nodepool_config.management.auto_repair, null)
      auto_upgrade = try(var.nodepool_config.management.auto_upgrade, null)
    }
  }

  dynamic "network_config" {
    for_each = var.pod_range != null ? [""] : []
    content {
      create_pod_range    = var.pod_range.create
      pod_ipv4_cidr_block = var.pod_range.cidr
      pod_range           = var.pod_range.name
    }
  }

  dynamic "upgrade_settings" {
    for_each = try(var.nodepool_config.upgrade_settings, null) != null ? [""] : []
    content {
      max_surge       = try(var.nodepool_config.upgrade_settings.max_surge, null)
      max_unavailable = try(var.nodepool_config.upgrade_settings.max_unavailable, null)
    }
  }

  node_config {
    boot_disk_kms_key = var.node_config.boot_disk_kms_key
    disk_size_gb      = var.node_config.disk_size_gb
    disk_type         = var.node_config.disk_type
    image_type        = var.node_config.image_type
    labels            = var.labels
    local_ssd_count   = var.node_config.local_ssd_count
    machine_type      = var.node_config.machine_type
    metadata          = local.node_metadata
    min_cpu_platform  = var.node_config.min_cpu_platform
    node_group        = var.sole_tenant_nodegroup
    oauth_scopes      = local.service_account_scopes
    preemptible       = var.node_config.preemptible
    service_account   = local.service_account_email
    spot = (
      var.node_config.spot == true && var.node_config.preemptible != true
    )
    tags = var.tags
    taint = (
      var.taints == null ? [] : concat(var.taints, local.taints_windows)
    )

    dynamic "ephemeral_storage_config" {
      for_each = var.node_config.ephemeral_ssd_count != null ? [""] : []
      content {
        local_ssd_count = var.node_config.ephemeral_ssd_count
      }
    }
    dynamic "gcfs_config" {
      for_each = var.node_config.gcfs && local.image.is_cos_containerd ? [""] : []
      content {
        enabled = true
      }
    }
    dynamic "guest_accelerator" {
      for_each = var.node_config.guest_accelerator != null ? [""] : []
      content {
        count              = var.node_config.guest_accelerator.count
        type               = var.node_config.guest_accelerator.type
        gpu_partition_size = var.node_config.guest_accelerator.gpu_partition_size
      }
    }
    dynamic "gvnic" {
      for_each = var.node_config.gvnic && local.image.is_cos ? [""] : []
      content {
        enabled = true
      }
    }
    dynamic "kubelet_config" {
      for_each = var.node_config.kubelet_config != null ? [""] : []
      content {
        cpu_manager_policy   = var.node_config.kubelet_config.cpu_manager_policy
        cpu_cfs_quota        = var.node_config.kubelet_config.cpu_cfs_quota
        cpu_cfs_quota_period = var.node_config.kubelet_config.cpu_cfs_quota_period
      }
    }
    dynamic "linux_node_config" {
      for_each = var.node_config.linux_node_config_sysctls != null ? [""] : []
      content {
        sysctls = var.node_config.linux_node_config_sysctls
      }
    }
    dynamic "reservation_affinity" {
      for_each = var.reservation_affinity != null ? [""] : []
      content {
        consume_reservation_type = var.reservation_affinity.consume_reservation_type
        key                      = var.reservation_affinity.key
        values                   = var.reservation_affinity.values
      }
    }
    dynamic "sandbox_config" {
      for_each = (
        var.node_config.sandbox_config_gvisor == true &&
        local.image.is_cos_containerd != null
        ? [""]
        : []
      )
      content {
        sandbox_type = "gvisor"
      }
    }
    dynamic "shielded_instance_config" {
      for_each = var.node_config.shielded_instance_config != null ? [""] : []
      content {
        enable_secure_boot          = var.node_config.shielded_instance_config.enable_secure_boot
        enable_integrity_monitoring = var.node_config.shielded_instance_config.enable_integrity_monitoring
      }
    }
    dynamic "workload_metadata_config" {
      for_each = var.node_config.workload_metadata_config_mode != null ? [""] : []
      content {
        mode = var.node_config.workload_metadata_config_mode
      }
    }
  }
}

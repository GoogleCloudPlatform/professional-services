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

resource "google_container_cluster" "cluster" {
  provider    = google-beta
  project     = var.project_id
  name        = var.name
  description = var.description
  location    = var.location
  node_locations = (
    length(var.node_locations) == 0 ? null : var.node_locations
  )
  min_master_version = var.min_master_version
  network            = var.vpc_config.network
  subnetwork         = var.vpc_config.subnetwork
  resource_labels    = var.labels
  default_max_pods_per_node = (
    var.enable_features.autopilot ? null : var.max_pods_per_node
  )
  enable_intranode_visibility = (
    var.enable_features.autopilot ? null : var.enable_features.intranode_visibility
  )
  enable_l4_ilb_subsetting = var.enable_features.l4_ilb_subsetting
  enable_shielded_nodes = (
    var.enable_features.autopilot ? null : var.enable_features.shielded_nodes
  )
  enable_tpu               = var.enable_features.tpu
  initial_node_count       = 1
  remove_default_node_pool = var.enable_features.autopilot ? null : true
  datapath_provider = (
    var.enable_features.dataplane_v2 || var.enable_features.autopilot
    ? "ADVANCED_DATAPATH"
    : "DATAPATH_PROVIDER_UNSPECIFIED"
  )
  enable_autopilot = var.enable_features.autopilot ? true : null

  # the default nodepool is deleted here, use the gke-nodepool module instead
  # node_config {}

  addons_config {
    dynamic "dns_cache_config" {
      for_each = !var.enable_features.autopilot ? [""] : []
      content {
        enabled = var.enable_addons.dns_cache
      }
    }
    http_load_balancing {
      disabled = !var.enable_addons.http_load_balancing
    }
    horizontal_pod_autoscaling {
      disabled = !var.enable_addons.horizontal_pod_autoscaling
    }
    dynamic "network_policy_config" {
      for_each = !var.enable_features.autopilot ? [""] : []
      content {
        disabled = !var.enable_addons.network_policy
      }
    }
    cloudrun_config {
      disabled = !var.enable_addons.cloudrun
    }
    istio_config {
      disabled = var.enable_addons.istio == null
      auth = (
        try(var.enable_addons.istio.enable_tls, false) ? "AUTH_MUTUAL_TLS" : "AUTH_NONE"
      )
    }
    gce_persistent_disk_csi_driver_config {
      enabled = (
        var.enable_features.autopilot
        ? true
        : var.enable_addons.gce_persistent_disk_csi_driver
      )
    }
    dynamic "gcp_filestore_csi_driver_config" {
      for_each = !var.enable_features.autopilot ? [""] : []
      content {
        enabled = var.enable_addons.gcp_filestore_csi_driver
      }
    }
    kalm_config {
      enabled = var.enable_addons.kalm
    }
    config_connector_config {
      enabled = var.enable_addons.config_connector
    }
    gke_backup_agent_config {
      enabled = var.enable_addons.gke_backup_agent
    }
  }

  dynamic "authenticator_groups_config" {
    for_each = var.enable_features.groups_for_rbac != null ? [""] : []
    content {
      security_group = var.enable_features.groups_for_rbac
    }
  }

  dynamic "binary_authorization" {
    for_each = var.enable_features.binary_authorization ? [""] : []
    content {
      evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
    }
  }

  dynamic "cluster_autoscaling" {
    for_each = var.cluster_autoscaling == null ? [] : [""]
    content {
      enabled = true
      dynamic "resource_limits" {
        for_each = var.cluster_autoscaling.cpu_limits != null ? [""] : []
        content {
          resource_type = "cpu"
          minimum       = var.cluster_autoscaling.cpu_limits.min
          maximum       = var.cluster_autoscaling.cpu_limits.max
        }
      }
      dynamic "resource_limits" {
        for_each = var.cluster_autoscaling.mem_limits != null ? [""] : []
        content {
          resource_type = "cpu"
          minimum       = var.cluster_autoscaling.mem_limits.min
          maximum       = var.cluster_autoscaling.mem_limits.max
        }
      }
      // TODO: support GPUs too
    }
  }

  dynamic "database_encryption" {
    for_each = var.enable_features.database_encryption != null ? [""] : []
    content {
      state    = var.enable_features.database_encryption.state
      key_name = var.enable_features.database_encryption.key_name
    }
  }

  dynamic "dns_config" {
    for_each = var.enable_features.cloud_dns != null ? [""] : []
    content {
      cluster_dns        = enable_features.cloud_dns.cluster_dns
      cluster_dns_scope  = enable_features.cloud_dns.cluster_dns_scope
      cluster_dns_domain = enable_features.cloud_dns.cluster_dns_domain
    }
  }

  dynamic "ip_allocation_policy" {
    for_each = var.vpc_config.secondary_range_blocks != null ? [""] : []
    content {
      cluster_ipv4_cidr_block  = var.vpc_config.secondary_range_blocks.pods
      services_ipv4_cidr_block = var.vpc_config.secondary_range_blocks.services
    }
  }
  dynamic "ip_allocation_policy" {
    for_each = var.vpc_config.secondary_range_names != null ? [""] : []
    content {
      cluster_secondary_range_name  = var.vpc_config.secondary_range_names.pods
      services_secondary_range_name = var.vpc_config.secondary_range_names.services
    }
  }

  dynamic "logging_config" {
    for_each = var.logging_config != null && !var.enable_features.autopilot ? [""] : []
    content {
      enable_components = var.logging_config
    }
  }

  maintenance_policy {
    dynamic "daily_maintenance_window" {
      for_each = (
        try(var.maintenance_config.daily_window_start_time, null) != null
        ? [""]
        : []
      )
      content {
        start_time = var.maintenance_config.daily_window_start_time
      }
    }
    dynamic "recurring_window" {
      for_each = (
        try(var.maintenance_config.recurring_window, null) != null
        ? [""]
        : []
      )
      content {
        start_time = var.maintenance_config.recurring_window.start_time
        end_time   = var.maintenance_config.recurring_window.end_time
        recurrence = var.maintenance_config.recurring_window.recurrence
      }
    }
    dynamic "maintenance_exclusion" {
      for_each = (
        try(var.maintenance_config.maintenance_exclusions, null) == null
        ? []
        : var.maintenance_config.maintenance_exclusions
      )
      iterator = exclusion
      content {
        exclusion_name = exclusion.value.name
        start_time     = exclusion.value.start_time
        end_time       = exclusion.value.end_time
      }
    }
  }

  master_auth {
    client_certificate_config {
      issue_client_certificate = var.issue_client_certificate
    }
  }

  dynamic "master_authorized_networks_config" {
    for_each = var.vpc_config.master_authorized_ranges != null ? [""] : []
    content {
      dynamic "cidr_blocks" {
        for_each = var.vpc_config.master_authorized_ranges
        iterator = range
        content {
          cidr_block   = range.value
          display_name = range.key
        }
      }
    }
  }

  dynamic "monitoring_config" {
    for_each = var.monitoring_config != null && !var.enable_features.autopilot ? [""] : []
    content {
      enable_components = var.monitoring_config.enable_components
      dynamic "managed_prometheus" {
        for_each = (
          try(var.monitoring_config.managed_prometheus, null) == true ? [""] : []
        )
        content {
          enabled = true
        }
      }
    }
  }

  # dataplane v2 has bult-in network policies
  dynamic "network_policy" {
    for_each = (
      var.enable_addons.network_policy && !var.enable_features.dataplane_v2
      ? [""]
      : []
    )
    content {
      enabled  = true
      provider = "CALICO"
    }
  }

  dynamic "notification_config" {
    for_each = var.enable_features.upgrade_notifications != null ? [""] : []
    content {
      pubsub {
        enabled = true
        topic = (
          try(var.enable_features.upgrade_notifications.topic_id, null) != null
          ? var.enable_features.upgrade_notifications.topic_id
          : google_pubsub_topic.notifications[0].id
        )
      }
    }
  }

  dynamic "private_cluster_config" {
    for_each = (
      var.private_cluster_config != null ? [""] : []
    )
    content {
      enable_private_nodes    = true
      enable_private_endpoint = var.private_cluster_config.enable_private_endpoint
      master_ipv4_cidr_block  = try(var.vpc_config.master_ipv4_cidr_block, null)
      master_global_access_config {
        enabled = var.private_cluster_config.master_global_access
      }
    }
  }

  dynamic "pod_security_policy_config" {
    for_each = var.enable_features.pod_security_policy ? [""] : []
    content {
      enabled = var.enable_features.pod_security_policy
    }
  }

  dynamic "release_channel" {
    for_each = var.release_channel != null ? [""] : []
    content {
      channel = var.release_channel
    }
  }

  dynamic "resource_usage_export_config" {
    for_each = (
      try(var.enable_features.resource_usage_export.dataset, null) != null
      ? [""]
      : []
    )
    content {
      enable_network_egress_metering = (
        var.enable_features.resource_usage_export.enable_network_egress_metering
      )
      enable_resource_consumption_metering = (
        var.enable_features.resource_usage_export.enable_resource_consumption_metering
      )
      bigquery_destination {
        dataset_id = var.enable_features.resource_usage_export.dataset
      }
    }
  }

  dynamic "vertical_pod_autoscaling" {
    for_each = var.enable_features.vertical_pod_autoscaling ? [""] : []
    content {
      enabled = var.enable_features.vertical_pod_autoscaling
    }
  }

  dynamic "workload_identity_config" {
    for_each = var.enable_features.workload_identity ? [""] : []
    content {
      workload_pool = "${var.project_id}.svc.id.goog"
    }
  }
}

resource "google_compute_network_peering_routes_config" "gke_master" {
  count = (
    try(var.private_cluster_config.peering_config, null) != null ? 1 : 0
  )
  project = (
    try(var.private_cluster_config.peering_config, null) == null
    ? var.project_id
    : var.private_cluster_config.peering_config.project_id
  )
  peering = try(
    google_container_cluster.cluster.private_cluster_config.0.peering_name,
    null
  )
  network              = element(reverse(split("/", var.vpc_config.network)), 0)
  import_custom_routes = var.private_cluster_config.peering_config.import_routes
  export_custom_routes = var.private_cluster_config.peering_config.export_routes
}

resource "google_pubsub_topic" "notifications" {
  count = (
    try(var.enable_features.upgrade_notifications.topic_id, null) == null ? 0 : 1
  )
  name = "gke-pubsub-notifications"
  labels = {
    content = "gke-notifications"
  }
}

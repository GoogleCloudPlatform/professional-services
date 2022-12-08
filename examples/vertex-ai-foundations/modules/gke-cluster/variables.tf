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

variable "cluster_autoscaling" {
  description = "Enable and configure limits for Node Auto-Provisioning with Cluster Autoscaler."
  type = object({
    auto_provisioning_defaults = optional(object({
      boot_disk_kms_key = optional(string)
      image_type        = optional(string)
      oauth_scopes      = optional(list(string))
      service_account   = optional(string)
    }))
    cpu_limits = optional(object({
      min = number
      max = number
    }))
    mem_limits = optional(object({
      min = number
      max = number
    }))
  })
  default = null
}

variable "description" {
  description = "Cluster description."
  type        = string
  default     = null
}

variable "enable_addons" {
  description = "Addons enabled in the cluster (true means enabled)."
  type = object({
    cloudrun                       = optional(bool, false)
    config_connector               = optional(bool, false)
    dns_cache                      = optional(bool, false)
    gce_persistent_disk_csi_driver = optional(bool, false)
    gcp_filestore_csi_driver       = optional(bool, false)
    gke_backup_agent               = optional(bool, false)
    horizontal_pod_autoscaling     = optional(bool, false)
    http_load_balancing            = optional(bool, false)
    istio = optional(object({
      enable_tls = bool
    }))
    kalm           = optional(bool, false)
    network_policy = optional(bool, false)
  })
  default = {
    horizontal_pod_autoscaling = true
    http_load_balancing        = true
  }
  nullable = false
}

variable "enable_features" {
  description = "Enable cluster-level features. Certain features allow configuration."
  type = object({
    autopilot            = optional(bool, false)
    binary_authorization = optional(bool, false)
    cloud_dns = optional(object({
      provider = optional(string)
      scope    = optional(string)
      domain   = optional(string)
    }))
    database_encryption = optional(object({
      state    = string
      key_name = string
    }))
    dataplane_v2         = optional(bool, false)
    groups_for_rbac      = optional(string)
    intranode_visibility = optional(bool, false)
    l4_ilb_subsetting    = optional(bool, false)
    pod_security_policy  = optional(bool, false)
    resource_usage_export = optional(object({
      dataset                              = string
      enable_network_egress_metering       = optional(bool)
      enable_resource_consumption_metering = optional(bool)
    }))
    shielded_nodes = optional(bool, false)
    tpu            = optional(bool, false)
    upgrade_notifications = optional(object({
      topic_id = optional(string)
    }))
    vertical_pod_autoscaling = optional(bool, false)
    workload_identity        = optional(bool, false)
  })
  default = {
    workload_identity = true
  }
}

variable "issue_client_certificate" {
  description = "Enable issuing client certificate."
  type        = bool
  default     = false
}

variable "labels" {
  description = "Cluster resource labels."
  type        = map(string)
  default     = null
}

variable "location" {
  description = "Cluster zone or region."
  type        = string
}

variable "logging_config" {
  description = "Logging configuration."
  type        = list(string)
  default     = ["SYSTEM_COMPONENTS"]
}

variable "maintenance_config" {
  description = "Maintenance window configuration."
  type = object({
    daily_window_start_time = optional(string)
    recurring_window = optional(object({
      start_time = string
      end_time   = string
      recurrence = string
    }))
    maintenance_exclusions = optional(list(object({
      name       = string
      start_time = string
      end_time   = string
      scope      = optional(string)
    })))
  })
  default = {
    daily_window_start_time = "03:00"
    recurring_window        = null
    maintenance_exclusion   = []
  }
}

variable "max_pods_per_node" {
  description = "Maximum number of pods per node in this cluster."
  type        = number
  default     = 110
}

variable "min_master_version" {
  description = "Minimum version of the master, defaults to the version of the most recent official release."
  type        = string
  default     = null
}

variable "monitoring_config" {
  description = "Monitoring components."
  type = object({
    enable_components  = optional(list(string))
    managed_prometheus = optional(bool)
  })
  default = {
    enable_components = ["SYSTEM_COMPONENTS"]
  }
}

variable "name" {
  description = "Cluster name."
  type        = string
}

variable "node_locations" {
  description = "Zones in which the cluster's nodes are located."
  type        = list(string)
  default     = []
  nullable    = false
}

variable "private_cluster_config" {
  description = "Private cluster configuration."
  type = object({
    enable_private_endpoint = optional(bool)
    master_global_access    = optional(bool)
    peering_config = optional(object({
      export_routes = optional(bool)
      import_routes = optional(bool)
      project_id    = optional(string)
    }))
  })
  default = null
}

variable "project_id" {
  description = "Cluster project id."
  type        = string
}

variable "release_channel" {
  description = "Release channel for GKE upgrades."
  type        = string
  default     = null
}

variable "vpc_config" {
  description = "VPC-level configuration."
  type = object({
    network                = string
    subnetwork             = string
    master_ipv4_cidr_block = optional(string)
    secondary_range_blocks = optional(object({
      pods     = string
      services = string
    }))
    secondary_range_names = optional(object({
      pods     = string
      services = string
    }), { pods = "pods", services = "services" })
    master_authorized_ranges = optional(map(string))
  })
  nullable = false
}

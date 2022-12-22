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

variable "cluster_name" {
  description = "Cluster name."
  type        = string
}

variable "gke_version" {
  description = "Kubernetes nodes version. Ignored if auto_upgrade is set in management_config."
  type        = string
  default     = null
}

variable "labels" {
  description = "Kubernetes labels applied to each node."
  type        = map(string)
  default     = {}
  nullable    = false
}

variable "location" {
  description = "Cluster location."
  type        = string
}

variable "max_pods_per_node" {
  description = "Maximum number of pods per node."
  type        = number
  default     = null
}

variable "name" {
  description = "Optional nodepool name."
  type        = string
  default     = null
}

variable "node_config" {
  description = "Node-level configuration."
  type = object({
    boot_disk_kms_key   = optional(string)
    disk_size_gb        = optional(number)
    disk_type           = optional(string)
    ephemeral_ssd_count = optional(number)
    gcfs                = optional(bool, false)
    guest_accelerator = optional(object({
      count              = number
      type               = string
      gpu_partition_size = optional(string)
    }))
    gvnic      = optional(bool, false)
    image_type = optional(string)
    kubelet_config = optional(object({
      cpu_manager_policy   = string
      cpu_cfs_quota        = optional(bool)
      cpu_cfs_quota_period = optional(string)
    }))
    linux_node_config_sysctls = optional(map(string))
    local_ssd_count           = optional(number)
    machine_type              = optional(string)
    metadata                  = optional(map(string))
    min_cpu_platform          = optional(string)
    preemptible               = optional(bool)
    sandbox_config_gvisor     = optional(bool)
    shielded_instance_config = optional(object({
      enable_integrity_monitoring = optional(bool)
      enable_secure_boot          = optional(bool)
    }))
    spot                          = optional(bool)
    workload_metadata_config_mode = optional(string)
  })
  default = {
    disk_type = "pd-balanced"
  }
}

variable "node_count" {
  description = "Number of nodes per instance group. Initial value can only be changed by recreation, current is ignored when autoscaling is used."
  type = object({
    current = optional(number)
    initial = number
  })
  default = {
    initial = 1
  }
  nullable = false
}

variable "node_locations" {
  description = "Node locations."
  type        = list(string)
  default     = null
}

variable "nodepool_config" {
  description = "Nodepool-level configuration."
  type = object({
    autoscaling = optional(object({
      location_policy = optional(string)
      max_node_count  = optional(number)
      min_node_count  = optional(number)
      use_total_nodes = optional(bool, false)
    }))
    management = optional(object({
      auto_repair  = optional(bool)
      auto_upgrade = optional(bool)
    }))
    # placement_policy = optional(bool)
    upgrade_settings = optional(object({
      max_surge       = number
      max_unavailable = number
    }))
  })
  default = null
}

variable "pod_range" {
  description = "Pod secondary range configuration."
  type = object({
    secondary_pod_range = object({
      cidr   = optional(string)
      create = optional(bool)
      name   = string
    })
  })
  default = null
}

variable "project_id" {
  description = "Cluster project id."
  type        = string
}

variable "reservation_affinity" {
  description = "Configuration of the desired reservation which instances could take capacity from."
  type = object({
    consume_reservation_type = string
    key                      = optional(string)
    values                   = optional(list(string))
  })
  default = null
}

variable "service_account" {
  description = "Nodepool service account. If this variable is set to null, the default GCE service account will be used. If set and email is null, a service account will be created. If scopes are null a default will be used."
  type = object({
    create       = optional(bool, false)
    email        = optional(string, null)
    oauth_scopes = optional(list(string), null)
  })
  default  = {}
  nullable = false
}

variable "sole_tenant_nodegroup" {
  description = "Sole tenant node group."
  type        = string
  default     = null
}

variable "tags" {
  description = "Network tags applied to nodes."
  type        = list(string)
  default     = null
}

variable "taints" {
  description = "Kubernetes taints applied to all nodes."
  type = list(object({
    key    = string
    value  = string
    effect = string
  }))
  default = null
}

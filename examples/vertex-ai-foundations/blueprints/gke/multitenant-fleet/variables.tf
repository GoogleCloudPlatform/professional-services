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

variable "billing_account_id" {
  description = "Billing account id."
  type        = string
}

variable "clusters" {
  description = "Clusters configuration. Refer to the gke-cluster module for type details."
  type = map(object({
    cluster_autoscaling = optional(any)
    description         = optional(string)
    enable_addons = optional(any, {
      horizontal_pod_autoscaling = true, http_load_balancing = true
    })
    enable_features = optional(any, {
      workload_identity = true
    })
    issue_client_certificate = optional(bool, false)
    labels                   = optional(map(string))
    location                 = string
    logging_config           = optional(list(string), ["SYSTEM_COMPONENTS"])
    maintenance_config = optional(any, {
      daily_window_start_time = "03:00"
      recurring_window        = null
      maintenance_exclusion   = []
    })
    max_pods_per_node  = optional(number, 110)
    min_master_version = optional(string)
    monitoring_config = optional(object({
      enable_components  = optional(list(string), ["SYSTEM_COMPONENTS"])
      managed_prometheus = optional(bool)
    }))
    node_locations         = optional(list(string))
    private_cluster_config = optional(any)
    release_channel        = optional(string)
    vpc_config = object({
      subnetwork = string
      network    = optional(string)
      secondary_range_blocks = optional(object({
        pods     = string
        services = string
      }))
      secondary_range_names = optional(object({
        pods     = string
        services = string
      }), { pods = "pods", services = "services" })
      master_authorized_ranges = optional(map(string))
      master_ipv4_cidr_block   = optional(string)
    })
  }))
  default  = {}
  nullable = false
}

variable "fleet_configmanagement_clusters" {
  description = "Config management features enabled on specific sets of member clusters, in config name => [cluster name] format."
  type        = map(list(string))
  default     = {}
  nullable    = false
}

variable "fleet_configmanagement_templates" {
  description = "Sets of config management configurations that can be applied to member clusters, in config name => {options} format."
  type = map(object({
    binauthz = bool
    config_sync = object({
      git = object({
        gcp_service_account_email = string
        https_proxy               = string
        policy_dir                = string
        secret_type               = string
        sync_branch               = string
        sync_repo                 = string
        sync_rev                  = string
        sync_wait_secs            = number
      })
      prevent_drift = string
      source_format = string
    })
    hierarchy_controller = object({
      enable_hierarchical_resource_quota = bool
      enable_pod_tree_labels             = bool
    })
    policy_controller = object({
      audit_interval_seconds     = number
      exemptable_namespaces      = list(string)
      log_denies_enabled         = bool
      referential_rules_enabled  = bool
      template_library_installed = bool
    })
    version = string
  }))
  default  = {}
  nullable = false
}

variable "fleet_features" {
  description = "Enable and configue fleet features. Set to null to disable GKE Hub if fleet workload identity is not used."
  type = object({
    appdevexperience             = bool
    configmanagement             = bool
    identityservice              = bool
    multiclusteringress          = string
    multiclusterservicediscovery = bool
    servicemesh                  = bool
  })
  default = null
}

variable "fleet_workload_identity" {
  description = "Use Fleet Workload Identity for clusters. Enables GKE Hub if set to true."
  type        = bool
  default     = false
  nullable    = false
}

variable "folder_id" {
  description = "Folder used for the GKE project in folders/nnnnnnnnnnn format."
  type        = string
}

variable "group_iam" {
  description = "Project-level IAM bindings for groups. Use group emails as keys, list of roles as values."
  type        = map(list(string))
  default     = {}
  nullable    = false
}

variable "iam" {
  description = "Project-level authoritative IAM bindings for users and service accounts in  {ROLE => [MEMBERS]} format."
  type        = map(list(string))
  default     = {}
  nullable    = false
}

variable "labels" {
  description = "Project-level labels."
  type        = map(string)
  default     = {}
}

variable "nodepools" {
  description = "Nodepools configuration. Refer to the gke-nodepool module for type details."
  type = map(map(object({
    gke_version           = optional(string)
    labels                = optional(map(string), {})
    max_pods_per_node     = optional(number)
    name                  = optional(string)
    node_config           = optional(any, { disk_type = "pd-balanced" })
    node_count            = optional(map(number), { initial = 1 })
    node_locations        = optional(list(string))
    nodepool_config       = optional(any)
    pod_range             = optional(any)
    reservation_affinity  = optional(any)
    service_account       = optional(any)
    sole_tenant_nodegroup = optional(string)
    tags                  = optional(list(string))
    taints                = optional(list(any))
  })))
  default  = {}
  nullable = false
}

variable "prefix" {
  description = "Prefix used for resources that need unique names."
  type        = string
}

variable "project_id" {
  description = "ID of the project that will contain all the clusters."
  type        = string
}

variable "project_services" {
  description = "Additional project services to enable."
  type        = list(string)
  default     = []
  nullable    = false
}

variable "vpc_config" {
  description = "Shared VPC project and VPC details."
  type = object({
    host_project_id = string
    vpc_self_link   = string
  })
}

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

variable "clusters" {
  description = "Clusters members of this GKE Hub in name => id format."
  type        = map(string)
  default     = {}
  nullable    = false
}

variable "configmanagement_clusters" {
  description = "Config management features enabled on specific sets of member clusters, in config name => [cluster name] format."
  type        = map(list(string))
  default     = {}
  nullable    = false
}

variable "configmanagement_templates" {
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

variable "features" {
  description = "Enable and configue fleet features."
  type = object({
    appdevexperience             = bool
    configmanagement             = bool
    identityservice              = bool
    multiclusteringress          = string
    multiclusterservicediscovery = bool
    servicemesh                  = bool
  })
  default = {
    appdevexperience             = false
    configmanagement             = false
    identityservice              = false
    multiclusteringress          = null
    servicemesh                  = false
    multiclusterservicediscovery = false
  }
  nullable = false
}

variable "project_id" {
  description = "GKE hub project ID."
  type        = string
}

variable "workload_identity_clusters" {
  description = "Clusters that will use Fleet Workload Identity."
  type        = list(string)
  default     = []
  nullable    = false
}

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
  _cluster_cm_config = flatten([
    for template, clusters in var.configmanagement_clusters : [
      for cluster in clusters : {
        cluster  = cluster
        template = lookup(var.configmanagement_templates, template, null)
      }
    ]
  ])
  cluster_cm_config = {
    for k in local._cluster_cm_config : k.cluster => k.template if(
      k.template != null &&
      var.features.configmanagement == true
    )
  }
  hub_features = {
    for k, v in var.features : k => v if v != null && v != false && v != ""
  }
}

resource "google_gke_hub_membership" "default" {
  provider      = google-beta
  for_each      = var.clusters
  project       = var.project_id
  membership_id = each.key
  endpoint {
    gke_cluster {
      resource_link = each.value
    }
  }
  dynamic "authority" {
    for_each = (
      contains(var.workload_identity_clusters, each.key) ? {} : { 1 = 1 }
    )
    content {
      issuer = "https://container.googleapis.com/v1/${var.clusters[each.key]}"
    }
  }
}

resource "google_gke_hub_feature" "default" {
  provider = google-beta
  for_each = local.hub_features
  project  = var.project_id
  name     = each.key
  location = "global"
  dynamic "spec" {
    for_each = each.key == "multiclusteringress" && each.value != null ? { 1 = 1 } : {}
    content {
      multiclusteringress {
        config_membership = google_gke_hub_membership.default[each.value].id
      }
    }
  }
}

resource "google_gke_hub_feature_membership" "default" {
  provider   = google-beta
  for_each   = local.cluster_cm_config
  project    = var.project_id
  location   = "global"
  feature    = google_gke_hub_feature.default["configmanagement"].name
  membership = google_gke_hub_membership.default[each.key].membership_id

  configmanagement {
    version = each.value.version

    dynamic "binauthz" {
      for_each = each.value.binauthz != true ? {} : { 1 = 1 }
      content {
        enabled = true
      }
    }

    dynamic "config_sync" {
      for_each = each.value.config_sync == null ? {} : { 1 = 1 }
      content {
        prevent_drift = each.value.config_sync.prevent_drift
        source_format = each.value.config_sync.source_format
        dynamic "git" {
          for_each = (
            try(each.value.config_sync.git, null) == null ? {} : { 1 = 1 }
          )
          content {
            gcp_service_account_email = (
              each.value.config_sync.git.gcp_service_account_email
            )
            https_proxy    = each.value.config_sync.git.https_proxy
            policy_dir     = each.value.config_sync.git.policy_dir
            secret_type    = each.value.config_sync.git.secret_type
            sync_branch    = each.value.config_sync.git.sync_branch
            sync_repo      = each.value.config_sync.git.sync_repo
            sync_rev       = each.value.config_sync.git.sync_rev
            sync_wait_secs = each.value.config_sync.git.sync_wait_secs
          }
        }
      }
    }

    dynamic "hierarchy_controller" {
      for_each = each.value.hierarchy_controller == null ? {} : { 1 = 1 }
      content {
        enable_hierarchical_resource_quota = (
          each.value.hierarchy_controller.enable_hierarchical_resource_quota
        )
        enable_pod_tree_labels = (
          each.value.hierarchy_controller.enable_pod_tree_labels
        )
        enabled = true
      }
    }

    dynamic "policy_controller" {
      for_each = each.value.policy_controller == null ? {} : { 1 = 1 }
      content {
        audit_interval_seconds = (
          each.value.policy_controller.audit_interval_seconds
        )
        exemptable_namespaces = (
          each.value.policy_controller.exemptable_namespaces
        )
        log_denies_enabled = (
          each.value.policy_controller.log_denies_enabled
        )
        referential_rules_enabled = (
          each.value.policy_controller.referential_rules_enabled
        )
        template_library_installed = (
          each.value.policy_controller.template_library_installed
        )
        enabled = true
      }
    }
  }
}

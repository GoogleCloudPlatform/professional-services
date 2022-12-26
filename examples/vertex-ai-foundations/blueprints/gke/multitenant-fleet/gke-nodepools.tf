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

# tfdoc:file:description GKE nodepools.

locals {
  nodepools = merge([
    for cluster, nodepools in var.nodepools : {
      for nodepool, config in nodepools :
      "${cluster}/${nodepool}" => merge(config, {
        name    = nodepool
        cluster = cluster
      })
    }
  ]...)
}

module "gke-nodepool" {
  source                = "../../../modules/gke-nodepool"
  for_each              = local.nodepools
  name                  = each.value.name
  project_id            = module.gke-project-0.project_id
  cluster_name          = module.gke-cluster[each.value.cluster].name
  location              = module.gke-cluster[each.value.cluster].location
  gke_version           = each.value.gke_version
  labels                = each.value.labels
  max_pods_per_node     = each.value.max_pods_per_node
  node_config           = each.value.node_config
  node_count            = each.value.node_count
  node_locations        = each.value.node_locations
  nodepool_config       = each.value.nodepool_config
  pod_range             = each.value.pod_range
  reservation_affinity  = each.value.reservation_affinity
  service_account       = each.value.service_account
  sole_tenant_nodegroup = each.value.sole_tenant_nodegroup
  tags                  = each.value.tags
  taints                = each.value.taints
}

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

# tfdoc:file:description GKE cluster and hub resources.

module "clusters" {
  for_each   = var.clusters_config
  source     = "../../../modules/gke-cluster"
  project_id = module.fleet_project.project_id
  name       = each.key
  location   = var.region
  vpc_config = {
    network    = module.svpc.self_link
    subnetwork = module.svpc.subnet_self_links["${var.region}/subnet-${each.key}"]
    master_authorized_ranges = merge({
      mgmt : var.mgmt_subnet_cidr_block
      },
      { for key, config in var.clusters_config :
        "pods-${key}" => config.pods_cidr_block if key != each.key
    })
    master_ipv4_cidr_block = each.value.master_cidr_block
  }
  private_cluster_config = {
    enable_private_endpoint = true
    master_global_access    = true
  }
  release_channel = "REGULAR"
  labels = {
    mesh_id = "proj-${module.fleet_project.number}"
  }
}

module "cluster_nodepools" {
  for_each     = var.clusters_config
  source       = "../../../modules/gke-nodepool"
  project_id   = module.fleet_project.project_id
  cluster_name = module.clusters[each.key].name
  location     = var.region
  name         = "nodepool-${each.key}"
  node_count   = { initial = 1 }
  service_account = {
    create = true
  }
  tags = ["${each.key}-node"]
}

module "hub" {
  source     = "../../../modules/gke-hub"
  project_id = module.fleet_project.project_id
  clusters   = { for k, v in module.clusters : k => v.id }
  features = {
    appdevexperience             = false
    configmanagement             = false
    identityservice              = false
    multiclusteringress          = null
    servicemesh                  = true
    multiclusterservicediscovery = false
  }
  depends_on = [
    module.fleet_project
  ]
}

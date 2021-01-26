/**
 * Copyright 2021 Google LLC
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

# create the clusters
# https://registry.terraform.io/modules/terraform-google-modules/kubernetes-engine/google/latest/submodules/private-cluster
module "gke-cluster3" {
  source                      = "terraform-google-modules/kubernetes-engine/google//modules/private-cluster"
  version                     = "12.3.0"
  project_id                  = var.project_id
  name                        = "cluster3"
  region                      = var.region
  regional                    = true
  release_channel             = "REGULAR"
  network                     = google_compute_network.asm-vpc-3.name
  subnetwork                  = google_compute_subnetwork.cluster3.name
  remove_default_node_pool    = true
  identity_namespace          = "${var.project_id}.svc.id.goog"
  ip_range_pods               = google_compute_subnetwork.cluster3.secondary_ip_range.0.range_name
  ip_range_services           = google_compute_subnetwork.cluster3.secondary_ip_range.1.range_name
  http_load_balancing         = false
  network_policy              = false
  enable_private_endpoint     = true
  enable_private_nodes        = true
  master_ipv4_cidr_block      = "192.168.2.0/28"
  master_authorized_networks  = [
      {
        cidr_block   = local.bastion_cidr
        display_name = "bastion-admin"
      },
      {
        cidr_block   = "10.185.192.0/18"
        display_name = "Cluster4 pods"
      },
    ]
  cluster_resource_labels = { "mesh_id" : local.mesh_id }
  node_metadata = "GKE_METADATA_SERVER"
  node_pools = [
    {
      name          = "cluster3-node-pool"
      autoscaling   = true
      min_count     = 1
      max_count     = 5
      auto_repair   = true
      auto_upgrade  = true
      machine_type  = "e2-standard-4"
      preemptible   = false
    },
  ]
  node_pools_oauth_scopes = {
    all = [
      "https://www.googleapis.com/auth/compute",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/trace.append",
      "https://www.googleapis.com/auth/cloud_debugger",
      "https://www.googleapis.com/auth/cloud-platform",
      "https://www.googleapis.com/auth/servicecontrol",
      "https://www.googleapis.com/auth/service.management.readonly"
    ]
  }
  node_pools_tags = {
    all = [
      "cluster3",
    ]
  }
}

module "gke-cluster4" {
  source                      = "terraform-google-modules/kubernetes-engine/google//modules/private-cluster"
  version                     = "12.3.0"
  project_id                  = var.project_id
  name                        = "cluster4"
  region                      = var.region
  regional                    = true
  release_channel             = "REGULAR"
  network                     = google_compute_network.asm-vpc-3.name
  subnetwork                  = google_compute_subnetwork.cluster4.name
  remove_default_node_pool    = true
  identity_namespace          = "${var.project_id}.svc.id.goog"
  ip_range_pods               = google_compute_subnetwork.cluster4.secondary_ip_range.0.range_name
  ip_range_services           = google_compute_subnetwork.cluster4.secondary_ip_range.1.range_name
  http_load_balancing         = false
  network_policy              = false
  enable_private_endpoint     = true
  enable_private_nodes        = true
  master_ipv4_cidr_block      = "192.168.3.0/28"
  master_authorized_networks  = [
    {
      cidr_block   = local.bastion_cidr
      display_name = "bastion-admin"
    },
    {
      cidr_block   = "10.185.128.0/18"
      display_name = "Cluster3 pods"
    },
  ]
  cluster_resource_labels = { "mesh_id" : local.mesh_id }
  node_metadata = "GKE_METADATA_SERVER"
  node_pools = [
    {
      name          = "cluster4-node-pool"
      autoscaling   = true
      min_count     = 1
      max_count     = 5
      auto_repair   = true
      auto_upgrade  = true
      machine_type  = "e2-standard-4"
      preemptible   = false
    },
  ]
  node_pools_oauth_scopes = {
    all = [
      "https://www.googleapis.com/auth/compute",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/trace.append",
      "https://www.googleapis.com/auth/cloud_debugger",
      "https://www.googleapis.com/auth/cloud-platform",
      "https://www.googleapis.com/auth/servicecontrol",
      "https://www.googleapis.com/auth/service.management.readonly"
    ]
  }
  node_pools_tags = {
    all = ["cluster4",]
  }
}

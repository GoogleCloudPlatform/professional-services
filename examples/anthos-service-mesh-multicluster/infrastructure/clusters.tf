/**
 * Copyright 2020 Google LLC
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
# https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-shared-vpc#creating_a_cluster_in_your_first_service_project
resource "google_container_cluster" "cluster3" {
  provider                 = google-beta
  name                     = local.cluster3_cluster_name
  location                 = var.region
  project                  = var.project_id
  #network                  = google_compute_network.asm-vpc-3.self_link
  network                  = data.google_compute_network.asm-vpc-3.self_link
  subnetwork               = google_compute_subnetwork.cluster3.self_link
  remove_default_node_pool = true
  initial_node_count       = local.cluster3_node_pool_initial_node_count
  networking_mode          = "VPC_NATIVE"
  # enable_shielded_nodes    = true

  resource_labels = {
    mesh_id = local.mesh_id
  }

  release_channel {
    channel = local.cluster3_cluster_release_channel
  }
  workload_identity_config {
    identity_namespace = "${var.project_id}.svc.id.goog"
  }
  addons_config {
    istio_config {
      disabled = true
    }
    network_policy_config {
      disabled = false
    }
  }
  network_policy {
    enabled = true
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = local.cluster3_pod_ip_range_name
    services_secondary_range_name = local.cluster3_services_ip_range_name
  }
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = true
    master_ipv4_cidr_block  = local.cluster3_master_ipv4_cidr_block
  }
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = local.bastion_cidr
      display_name = "bastion-admin"
    }
    cidr_blocks {
      cidr_block   = local.cluster4_pod_ip_cidr_range
      display_name = "Cluster4 pods"
    }
  }
}

resource "google_container_node_pool" "cluster3_node_pool" {
  provider           = google-beta
  name               = "${local.cluster3_cluster_name}-node-pool"
  location           = var.region
  initial_node_count = local.cluster3_node_pool_initial_node_count
  cluster            = google_container_cluster.cluster3.name
  project            = var.project_id

  autoscaling {
    min_node_count = local.cluster3_node_pool_autoscaling_min_node_count
    max_node_count = local.cluster3_node_pool_autoscaling_max_node_count
  }
  management {
    auto_repair  = local.cluster3_node_pool_auto_repair
    auto_upgrade = local.cluster3_node_pool_auto_upgrade
  }
  upgrade_settings {
    max_surge       = local.cluster3_node_pool_max_surge
    max_unavailable = local.cluster3_node_pool_max_unavailable
  }
  node_config {
    machine_type = local.cluster3_node_pool_machine_type
    tags         = [local.cluster3_network_tag]
    preemptible  = local.node_pool_preemptible
    # image_type   = "COS_CONTAINERD"
    oauth_scopes = local.cluster3_node_pool_oauth_scopes
    # shielded_instance_config {
    #   enable_secure_boot = true
    # }
    workload_metadata_config {
      node_metadata = "GKE_METADATA_SERVER"
    }
  }
}

resource "google_container_cluster" "cluster4" {
  provider                 = google-beta
  name                     = local.cluster4_cluster_name
  location                 = var.region
  project                  = var.project_id
  #network                  = google_compute_network.asm-vpc-3.self_link
  network                  = data.google_compute_network.asm-vpc-3.self_link
  subnetwork               = google_compute_subnetwork.cluster4.self_link
  remove_default_node_pool = true
  initial_node_count       = local.cluster4_node_pool_initial_node_count
  networking_mode          = "VPC_NATIVE"
  # enable_shielded_nodes    = true

  resource_labels = {
    mesh_id = local.mesh_id
  }

  release_channel {
    channel = local.cluster4_cluster_release_channel
  }
  workload_identity_config {
    identity_namespace = "${var.project_id}.svc.id.goog"
  }
  addons_config {
    # TODO: likely superfluous / removable
    istio_config {
      disabled = true
    }
    network_policy_config {
      disabled = false
    }
  }

  network_policy {
    enabled = true
  }
  ip_allocation_policy {
    cluster_secondary_range_name  = local.cluster4_pod_ip_range_name
    services_secondary_range_name = local.cluster4_services_ip_range_name
  }
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = true
    master_ipv4_cidr_block  = local.cluster4_master_ipv4_cidr_block
  }
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = local.bastion_cidr
      display_name = "bastion-admin"
    }     
    cidr_blocks {
      cidr_block   = local.cluster3_pod_ip_cidr_range
      display_name = "Cluster3 pods"
    }
  }
}

resource "google_container_node_pool" "cluster4_node_pool" {
  provider           = google-beta
  name               = "${local.cluster4_cluster_name}-node-pool"
  location           = var.region
  initial_node_count = local.cluster4_node_pool_initial_node_count
  cluster            = google_container_cluster.cluster4.name
  project            = var.project_id

  autoscaling {
    min_node_count = local.cluster4_node_pool_autoscaling_min_node_count
    max_node_count = local.cluster4_node_pool_autoscaling_max_node_count
  }
  management {
    auto_repair  = local.cluster4_node_pool_auto_repair
    auto_upgrade = local.cluster4_node_pool_auto_upgrade
  }
  upgrade_settings {
    max_surge       = local.cluster4_node_pool_max_surge
    max_unavailable = local.cluster4_node_pool_max_unavailable
  }

  node_config {
    machine_type = local.cluster4_node_pool_machine_type
    tags         = [local.cluster4_network_tag]
    preemptible  = local.node_pool_preemptible
    # image_type   = "COS_CONTAINERD"
    oauth_scopes = local.cluster4_node_pool_oauth_scopes
    # shielded_instance_config {
    #   enable_secure_boot = true
    # }
    workload_metadata_config {
      node_metadata = "GKE_METADATA_SERVER"
    }
  }
}

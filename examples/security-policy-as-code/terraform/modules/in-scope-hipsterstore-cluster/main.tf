/**
 * Copyright 2019 Google LLC
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
  subnetwork = "projects/${var.network_project_id}/regions/${var.region}/subnetworks/${var.subnetwork_name}"
}

resource "google_compute_global_address" "frontend-ext-ip" {
  name         = "frontend-ext-ip"
  project      = var.project_id
  description  = "The external IP address for the frontend of the Demo site."
  address_type = "EXTERNAL"
}

resource "google_container_cluster" "primary" {
  count              = var.enabled == "true" ? 1 : 0
  name               = var.cluster_name
  min_master_version = var.gke_minimum_version
  location           = var.cluster_location
  node_locations     = var.node_locations
  network            = var.network_self_link
  subnetwork         = local.subnetwork
  project            = var.project_id

  # We use a custom fluentd DaemonSet to manage logging. We do this so we can
  # configure filter rules to mask sensitive data.
  logging_service    = "none"
  monitoring_service = "monitoring.googleapis.com"

  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  initial_node_count = 1

  remove_default_node_pool = true

  # Required for initial cluster setup. Avoids setting the node service
  # account to the incorrect default service account.
  node_config {
    service_account = var.service_account_email
    preemptible     = true
    tags            = var.cluster_tags
  }

  resource_labels = {
    env = var.env
  }

  # Setting an empty username and password explicitly disables basic auth
  master_auth {
    username = ""
    password = ""

    client_certificate_config {
      issue_client_certificate = false
    }
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = var.pod_ip_range_name
    services_secondary_range_name = var.services_ip_range_name
  }

  addons_config {
    network_policy_config {
      disabled = false
    }
  }

  network_policy {
    provider = "CALICO"
    enabled  = true
  }

  private_cluster_config {
    # In a private cluster, nodes do not have public IP addresses, and the master
    # is inaccessible by default.
    enable_private_nodes    = true
    enable_private_endpoint = true

    # "Master IP range" is a private RFC 1918 reange for the master's VPC. The
    # master range must not overlap with any subnet in your cluster's VPC. The
    # master and your cluster use VPC peering to communicate privately.
    # See https://cloud.google.com/kubernetes-engine/docs/how-to/private-clusters
    master_ipv4_cidr_block = "10.10.11.0/28"
  }

  # Allows any traffic to access cluster master on its public IP address.
  # Change this to limit accessibility to a range of IPs or corporate network.
  # You'll need access to the master to run `kubectl` commands
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = var.mgmt_subnet_cidr
      display_name = "all"
    }
  }
}

resource "google_container_node_pool" "primary_preemptible_nodes" {
  count              = var.enabled == "true" ? 1 : 0
  name               = "${var.cluster_name}-node-pool"
  depends_on         = [google_container_cluster.primary[0]]
  version            = var.gke_minimum_version
  location           = var.cluster_location
  initial_node_count = 2

  autoscaling {
    min_node_count = 1
    max_node_count = 10
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  cluster = google_container_cluster.primary[0].name
  project = var.project_id

  node_config {
    preemptible     = true
    machine_type    = "n1-standard-1"
    service_account = var.service_account_email

    tags = var.cluster_tags

    oauth_scopes = [
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/trace.append",
      "https://www.googleapis.com/auth/service.management.readonly",
      "https://www.googleapis.com/auth/servicecontrol",
      "https://www.googleapis.com/auth/cloud_debugger",
    ]
  }
}

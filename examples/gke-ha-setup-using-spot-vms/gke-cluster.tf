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

# GKE cluster
resource "google_container_cluster" "cluster" {
  name     = "${var.project_id}-gke"
  location = var.zone
  project = var.project_id
  
  remove_default_node_pool = true
  initial_node_count  = 1

  depends_on = [
    google_project_service.project
  ]
}


# Spot pool
resource "google_container_node_pool" "spot_pool" {
  provider = google-beta

  name       = "spot-node-pool"
  location   = var.zone 
  project = var.project_id
  cluster    = google_container_cluster.cluster.name
  node_count = 1
  autoscaling {
    min_node_count = 0
    max_node_count = 5
  }

  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      env = var.project_id
    }

    spot = true
    machine_type = var.machine_type
    tags         = ["gke-spot-node"]
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}

# On-demand pool
resource "google_container_node_pool" "on_demand_pool" {
  name       = "on-demand-node-pool"
  location   = var.zone 
  project = var.project_id
  cluster    = google_container_cluster.cluster.name
  node_count = 1
  autoscaling {
    min_node_count = 0
    max_node_count = 3
  }

  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    labels = {
      env = var.project_id
    }

    machine_type = var.machine_type
    tags         = ["gke-on-demand-node"]
    metadata = {
      disable-legacy-endpoints = "true"
    }
    taint = [ {
      effect = "PREFER_NO_SCHEDULE"
      key = "type"
      value = "on-demand"
    } ]
  }
}
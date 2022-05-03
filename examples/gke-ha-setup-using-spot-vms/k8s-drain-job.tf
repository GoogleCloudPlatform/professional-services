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

# Retrieve an access token as the Terraform runners
data "google_client_config" "provider" {}

resource "kubernetes_namespace" "drain_job_ns" {
  metadata {
    name = var.drain_job_name
    annotations = {
      name = "${var.drain_job_name}-namespace"
    }
  }
}

resource "kubernetes_service_account" "drain_job_sa" {
  metadata {
    name      = "${var.drain_job_name}-sa"
    namespace = var.drain_job_name
  }
  automount_service_account_token = true
  depends_on = [
    google_container_node_pool.spot_pool,
    google_container_node_pool.on_demand_pool
  ]
}

# Create a K8S Service Account to allow drain job
resource "kubernetes_cluster_role" "drain_job_role" {
  metadata {
    name = "${var.drain_job_name}-role"
  }

  rule {
    api_groups = [""]
    resources  = ["pods/eviction"]
    verbs      = ["create"]
  }

  rule {
    api_groups = [""]
    resources  = ["pods"]
    verbs      = ["get", "list"]
  }

  rule {
    api_groups = [""]
    resources  = ["nodes"]
    verbs      = ["get", "patch", "list"]
  }

  rule {
    api_groups = [",apps"]
    resources  = ["statefulsets"]
    verbs      = ["get", "list"]
  }

  rule {
    api_groups = [",extensions"]
    resources  = ["daemonsets", "replicasets"]
    verbs      = ["get", "list"]
  }
  depends_on = [
    google_container_node_pool.spot_pool,
    google_container_node_pool.on_demand_pool
  ]
}

resource "kubernetes_cluster_role_binding" "drain_job_role_binding" {
  metadata {
    name = "${var.drain_job_name}-role-binding"
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = "${var.drain_job_name}-role"
  }
  subject {
    kind      = "ServiceAccount"
    name      = "${var.drain_job_name}-sa"
    namespace = var.drain_job_name
  }
  depends_on = [
    google_container_node_pool.spot_pool,
    google_container_node_pool.on_demand_pool
  ]
}

# Create drain job as CRON job
locals {
  drain_job_script = <<EOT
        # get names of all nodes which are not spot (and therefore on-demand)
        echo "Starting drain script (every 15 mins)"
        nodes_to_drain_arr=$(kubectl get nodes --selector='!cloud.google.com/gke-spot' -o=custom-columns=NAME:.metadata.name);


        for node_name in $${nodes_to_drain_arr[@]}; do
        # avoid using NAME headline as node name
        if [ "$node_name" != "NAME" ]; then 
            echo "Attempting to drain $node_name from app pods"
            kubectl drain $node_name --pod-selector=my-app-1 --delete-emptydir-data
            kubectl drain $node_name --pod-selector=my-app-2 --delete-emptydir-data
            kubectl drain $node_name --pod-selector=my-app-n --delete-emptydir-data
        fi
        done

        # make drained nodes available for use again
        for node_name in $${nodes_to_drain_arr[@]}; do
        # avoid using NAME headline as node name
        if [ "$node_name" != "NAME" ]; then 
            echo "Uncordoning $node_name"
            kubectl uncordon $node_name
        fi
        done

    EOT
}
resource "kubernetes_cron_job_v1" "drain_job" {
  metadata {
    name      = var.drain_job_name
    namespace = var.drain_job_name
  }
  spec {
    concurrency_policy            = "Forbid"
    failed_jobs_history_limit     = 1
    schedule                      = "*/15 * * * *"
    successful_jobs_history_limit = 1
    job_template {
      metadata {
        name = var.drain_job_name
      }
      spec {
        parallelism = 1
        template {
          metadata {
            name = var.drain_job_name
          }
          spec {
            service_account_name = "${var.drain_job_name}-sa"
            restart_policy = "OnFailure"
            termination_grace_period_seconds = 30
            container {
              name  = var.drain_job_name
              image = "bitnami/kubectl:latest"
              command = [
                "/bin/bash",
                "-c",
                <<EOF
        echo "Starting drain script (every 15 mins)"; \
        nodes_to_drain_arr=$(kubectl get nodes --selector='!cloud.google.com/gke-spot' -o=custom-columns=NAME:.metadata.name); \
        for node_name in $${nodes_to_drain_arr[@]}; do \
        if [ "$node_name" != "NAME" ]; then  \
            echo "Attempting to drain $node_name from app pods";\
            kubectl drain $node_name --pod-selector=my-app-1 --delete-emptydir-data; \
            kubectl drain $node_name --pod-selector=my-app-2 --delete-emptydir-data; \
            kubectl drain $node_name --pod-selector=my-app-n --delete-emptydir-data; \
        fi; \
        done; \
        for node_name in $${nodes_to_drain_arr[@]}; do \
        if [ "$node_name" != "NAME" ]; then \
            echo "Uncordoning $node_name"; \
            kubectl uncordon $node_name; \
        fi; \
        done; \

    EOF
              ]
            }
          }
        }
      }
    }
  }
  depends_on = [
    google_container_node_pool.spot_pool,
    google_container_node_pool.on_demand_pool
  ]
}

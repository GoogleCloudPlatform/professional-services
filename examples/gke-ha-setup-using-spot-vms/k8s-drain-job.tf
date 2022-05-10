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
            service_account_name             = "${var.drain_job_name}-sa"
            restart_policy                   = "OnFailure"
            termination_grace_period_seconds = 30
            container {
              name  = var.drain_job_name
              image = "bitnami/kubectl:latest"
              command = [
                "/bin/bash",
                "-c",
                file("drain-job.sh")
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

resource "kubernetes_pod_disruption_budget" "drain_job_pdb" {
  metadata {
    name      = "${var.drain_job_name}-pdb"
    namespace = var.drain_job_name
  }
  spec {
    max_unavailable = "50%"
    selector {
      match_labels = {
        run = var.drain_job_name
      }
    }
  }
  depends_on = [
    kubernetes_namespace.drain_job_ns
  ]
}

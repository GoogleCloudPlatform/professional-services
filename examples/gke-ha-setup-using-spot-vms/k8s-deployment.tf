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

resource "kubernetes_namespace" "my_app_ns" {
  metadata {
    name = var.app_name

    annotations = {
      name = "${var.app_name}-namespace"
    }
  }
}

resource "kubernetes_deployment" "my_app" {
  metadata {
    name = var.app_name
    labels = {
      app = var.app_name
    }
    namespace = var.app_name
  }

  spec {
    replicas = 3

    selector {
      match_labels = {
        run = var.app_name
      }
    }

    template {
      metadata {
        labels = {
          run = var.app_name
        }
        namespace = var.app_name
      }

      spec {
        container {
          image = "k8s.gcr.io/pause:2.0"
          name  = "pause"

          resources {
            requests = {
              cpu    = "600m"
              memory = "450m"
            }
          }
        }
        affinity {
          node_affinity {
            preferred_during_scheduling_ignored_during_execution {
              weight = 1
              preference {
                match_expressions {
                  key = "cloud.google.com/gke-spot"
                  operator = "In"
                  values = [true]
                }
              }
            }
          }
        }
        toleration {
          key = "type"
          value = "on-demand"
          operator = "Equal"
          effect = "PreferNoSchedule"
        }
      }
    }
  }
}

resource "kubernetes_pod_disruption_budget" "my_app_pdb" {
  metadata {
    name = "${var.app_name}-pdb"
    namespace = var.app_name
  }
  spec {
    max_unavailable = "20%"
    selector {
      match_labels = {
        run = var.app_name
      }
    }
  }
}


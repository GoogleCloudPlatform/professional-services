data "google_client_config" "default" {}


provider "kubernetes" {
  host                   = "https://${google_container_cluster.ltf_autopilot_cluster.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(google_container_cluster.ltf_autopilot_cluster.master_auth[0].cluster_ca_certificate)

  # ignore_annotations = [
  #   "^autopilot\\.gke\\.io\\/.*",
  #   "^cloud\\.google\\.com\\/.*"
  # ]
}

locals {
  resource_prefix = lower(replace(var.deployment_id, "/[^a-z0-9\\-]+/", ""))
  user_class_map = {
    "http" = "HttpVectorSearchUser"
    "grpc" = "GrpcVectorSearchUser"
  }

  user_class = local.user_class_map[var.locust_test_type]
}

resource "google_project_iam_binding" "aiplatform_viewer_binding" {
  project = var.project_id
  role    = "roles/aiplatform.viewer"
  members = [
    "serviceAccount:${google_service_account.service_account.email}",
  ]
}

resource "google_project_iam_member" "aiplatform_viewer_k8s_binding" {
  project = var.project_id
  role    = "roles/aiplatform.viewer"
  member  = "serviceAccount:${var.project_id}.svc.id.goog[default/default]" # Standard format

  depends_on = [
    google_container_cluster.ltf_autopilot_cluster
  ]
}

# Create a Kubernetes namespace specific to this deployment to avoid Workload Identity conflicts
resource "kubernetes_namespace" "locust_namespace" {
  metadata {
    name = "${local.resource_prefix}-ns"
  }

  depends_on = [
    google_container_cluster.ltf_autopilot_cluster
  ]
}

# Create a dedicated Kubernetes service account for this deployment
resource "kubernetes_service_account" "locust_service_account" {
  metadata {
    name      = "${local.resource_prefix}-sa"
    namespace = kubernetes_namespace.locust_namespace.metadata[0].name

    # Add annotation for Workload Identity
    annotations = {
      "iam.gke.io/gcp-service-account" = google_service_account.service_account.email
    }
  }

  depends_on = [
    kubernetes_namespace.locust_namespace
  ]
}

resource "kubernetes_config_map" "locust_config" {
  metadata {
    name      = "${local.resource_prefix}-config"
    namespace = kubernetes_namespace.locust_namespace.metadata[0].name
  }

  data = {
    "locust_config.env" = file("${path.module}/../../../config/locust_config.env")
  }

  depends_on = [
    kubernetes_namespace.locust_namespace
  ]
}

resource "kubernetes_deployment" "locust_master" {
  metadata {
    name      = "${local.resource_prefix}-master"
    namespace = kubernetes_namespace.locust_namespace.metadata[0].name
  }
  spec {
    selector {
      match_labels = {
        app = "${local.resource_prefix}-master"
      }
    }
    template {
      metadata {
        labels = {
          app = "${local.resource_prefix}-master"
        }
      }
      spec {
        service_account_name            = kubernetes_service_account.locust_service_account.metadata[0].name
        automount_service_account_token = true

        volume {
          name = "${local.resource_prefix}-config"
          config_map {
            name         = kubernetes_config_map.locust_config.metadata[0].name
            default_mode = "0644"
          }
        }
        container {
          image = var.image
          name  = "locust-master"
          volume_mount {
            name       = "${local.resource_prefix}-config"
            mount_path = "/tasks/locust_config.env"
            sub_path   = "locust_config.env"
          }
          args = ["-f", "/tasks/locust.py", "--master", "--class-picker", "--tags=${var.locust_test_type}", "${local.user_class}"]
          port {
            container_port = 8089
            name           = "loc-master-web"
          }
          port {
            container_port = 5557
            name           = "loc-master-p1"
          }
          port {
            container_port = 5558
            name           = "loc-master-p2"
          }
        }
      }
    }
  }

  depends_on = [
    kubernetes_service_account.locust_service_account
  ]
}

resource "kubernetes_deployment" "locust_worker" {
  metadata {
    name      = "${local.resource_prefix}-worker"
    namespace = kubernetes_namespace.locust_namespace.metadata[0].name
  }
  spec {
    selector {
      match_labels = {
        app = "${local.resource_prefix}-worker"
      }
    }
    template {
      metadata {
        labels = {
          app = "${local.resource_prefix}-worker"
        }
      }
      spec {
        service_account_name            = kubernetes_service_account.locust_service_account.metadata[0].name
        automount_service_account_token = true

        volume {
          name = "${local.resource_prefix}-config"
          config_map {
            name         = kubernetes_config_map.locust_config.metadata[0].name
            default_mode = "0644"
          }
        }
        container {
          image = var.image
          name  = "locust-worker"
          volume_mount {
            name       = "${local.resource_prefix}-config"
            mount_path = "/tasks/locust_config.env"
            sub_path   = "locust_config.env"
          }
          args = ["-f", "/tasks/locust.py", "--worker", "--master-host", "${local.resource_prefix}-master", "--tags=${var.locust_test_type}", "${local.user_class}"]
          resources {
            requests = {
              cpu = "1000m"
            }
          }
        }
      }
    }
  }

  depends_on = [
    kubernetes_service_account.locust_service_account
  ]
}

resource "kubernetes_service" "locust_master" {
  metadata {
    name      = "${local.resource_prefix}-master"
    namespace = kubernetes_namespace.locust_namespace.metadata[0].name
    labels = {
      app = "${local.resource_prefix}-master"
    }
  }
  spec {
    selector = {
      app = "${local.resource_prefix}-master"
    }
    port {
      port        = 8089
      target_port = "loc-master-web"
      name        = "loc-master-web"
    }
    port {
      port        = 5557
      target_port = "loc-master-p1"
      name        = "loc-master-p1"
    }
    port {
      port        = 5558
      target_port = "loc-master-p2"
      name        = "loc-master-p2"
    }
  }
}

resource "kubernetes_service" "locust_master_web" {
  metadata {
    name      = "${local.resource_prefix}-master-web"
    namespace = kubernetes_namespace.locust_namespace.metadata[0].name
    annotations = var.create_external_ip ? {} : {
      "networking.gke.io/load-balancer-type" = "Internal"
    }
    labels = {
      app = "${local.resource_prefix}-master"
    }
  }
  spec {
    selector = {
      app = "${local.resource_prefix}-master"
    }
    port {
      port        = 8089
      target_port = "loc-master-web"
      name        = "loc-master-web"
    }
    type = "LoadBalancer"
  }
}

resource "kubernetes_horizontal_pod_autoscaler" "locust_worker_autoscaler" {
  metadata {
    name      = "${local.resource_prefix}-worker-autoscaler"
    namespace = kubernetes_namespace.locust_namespace.metadata[0].name
  }

  spec {
    min_replicas = var.min_replicas_worker
    max_replicas = 1000

    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = "${local.resource_prefix}-worker"
    }
    target_cpu_utilization_percentage = 50
  }
}
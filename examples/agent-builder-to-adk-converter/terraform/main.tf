# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Artifact Registry repository for container images
resource "google_artifact_registry_repository" "converter_repo" {
  provider      = google
  project       = var.project_id
  location      = var.region
  repository_id = var.repository_name
  description   = "Artifact Registry Docker repository for Agent Builder to ADK Converter"
  format        = "DOCKER"

  labels = {
    solution    = "agent-builder-to-adk-converter"
    environment = var.environment
    managed-by  = "terraform"
  }
}

# Cloud Run v2 service for web application and conversion API
resource "google_cloud_run_v2_service" "converter_service" {
  provider = google
  project  = var.project_id
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.converter_sa.email

    containers {
      image = var.container_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
      }

      env {
        name  = "PORT"
        value = "8080"
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }

      startup_probe {
        initial_delay_seconds = 0
        timeout_seconds       = 3
        period_seconds        = 5
        failure_threshold     = 3
        tcp_socket {
          port = 8080
        }
      }

      liveness_probe {
        initial_delay_seconds = 10
        timeout_seconds       = 3
        period_seconds        = 10
        failure_threshold     = 3
        http_get {
          path = "/api/health"
          port = 8080
        }
      }
    }

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    labels = {
      solution    = "agent-builder-to-adk-converter"
      environment = var.environment
      managed-by  = "terraform"
    }
  }

  depends_on = [
    google_service_account.converter_sa,
    google_project_iam_member.logging_writer,
    google_project_iam_member.artifact_reader,
    google_artifact_registry_repository.converter_repo,
  ]
}

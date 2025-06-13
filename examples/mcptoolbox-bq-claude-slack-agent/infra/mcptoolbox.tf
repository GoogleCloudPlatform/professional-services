/**
 * Copyright 2025 Google LLC
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
  mcptoolbox_config_redered = templatefile("${path.module}/mcptoolbox/tools.yaml.tpl", {
    project_id = var.project_id
    dataset_id = local.bq_dataset
  })
  mcp_server_uri = "${google_cloud_run_v2_service.mcptoolbox.uri}"
}

resource "google_secret_manager_secret" "tools_yaml" {
  project   = var.project_id
  secret_id = "mcptoolbox-tools-yaml"

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "tools_yaml_version" {
  secret                = google_secret_manager_secret.tools_yaml.id
  is_secret_data_base64 = false
  secret_data           = local.mcptoolbox_config_redered
}

resource "google_service_account" "toolbox" {
  project    = var.project_id
  account_id = "toolbox-identity"
}

resource "google_secret_manager_secret_iam_member" "secret_accessor" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.tools_yaml.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.toolbox.email}"
}

resource "google_bigquery_dataset_iam_member" "bq_dataset_querier" {
  project    = var.project_id
  dataset_id = google_bigquery_dataset.dataset.dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = "serviceAccount:${google_service_account.toolbox.email}"
}

resource "google_project_iam_member" "bq_job_user" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.toolbox.email}"
}

resource "google_cloud_run_v2_service" "mcptoolbox" {
  name     = "mcptoolbox-server"
  location = var.region

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 1
    }
    service_account = google_service_account.toolbox.email
    volumes {
      name = "secrets-volume"
      secret {
        secret = google_secret_manager_secret.tools_yaml.secret_id
        items {
          version = "latest"
          path    = "tools.yaml"
        }
      }
    }
    containers {
      image = "us-central1-docker.pkg.dev/database-toolbox/toolbox/toolbox:latest"
      volume_mounts {
        name       = "secrets-volume"
        mount_path = "/app/config"
      }
      args = ["--tools-file=/app/config/tools.yaml", "--address=0.0.0.0", "--port=8080", "--log-level=debug"]
      ports {
        container_port = 8080
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_artifact_registry_repository.default,
    google_secret_manager_secret_iam_member.secret_accessor
  ]
}

resource "google_cloud_run_service_iam_member" "mcp_allow_slackapp" {
  location = google_cloud_run_v2_service.mcptoolbox.location
  project  = google_cloud_run_v2_service.mcptoolbox.project
  service  = google_cloud_run_v2_service.mcptoolbox.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

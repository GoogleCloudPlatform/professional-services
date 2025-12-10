# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# --- Service Accounts ---
resource "google_service_account" "run_sa" {
  account_id   = "${var.resource_prefix}-${var.environment}-run"
  display_name = "SA for ${var.service_name} (${var.environment}) Runtime"
}

resource "google_service_account" "trigger_sa" {
  account_id   = "${var.resource_prefix}-${var.environment}-trig"
  display_name = "SA for ${var.service_name} (${var.environment}) Trigger"
}

# --- Core Resources ---
resource "google_artifact_registry_repository" "repo" {
  location      = var.gcp_region
  repository_id = "${var.resource_prefix}-${var.environment}-repo"
  description   = "Docker repository for ${var.service_name}"
  format        = "DOCKER"
}

resource "google_cloud_run_v2_service" "this" {
  name             = var.service_name
  location         = var.gcp_region
  custom_audiences = var.custom_audiences
  deletion_protection = false

  template {
    service_account = google_service_account.run_sa.email
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [var.cloud_sql_connection_name]
      }
    }
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello:latest"
      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
      }

      env {
        name = "INSTANCE_CONNECTION_NAME"
        value = var.cloud_sql_connection_name
      }
      env {
        name = "DB_HOST"
        value = "/cloudsql/${var.cloud_sql_connection_name}"
      }
      env {
        name = "DB_NAME"
        value = var.db_name
      }
      env {
        name = "DB_USER"
        value = var.db_user
      }

      env {
        name = "DB_PASS"
        value_source {
          secret_key_ref {
            secret = var.db_secret_id
            version = "latest"
          }
        }
      }

      # non secret env vars
      dynamic "env" {
        for_each = var.container_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      # secrets
      dynamic "env" {
        for_each = var.runtime_secrets
        content {
          name = env.key # The ENV_VAR_NAME
          value_source {
            secret_key_ref {
              secret  = env.value # The SECRET_NAME
              version = "latest"
            }
          }
        }
      }

      volume_mounts {
        name = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
    scaling {
      min_instance_count = var.scaling_min_instances
      max_instance_count = var.scaling_max_instances
    }
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].image, client, client_version]
  }
}

resource "google_cloudbuild_trigger" "this" {
  name            = "${var.service_name}-trigger"
  location        = var.gcp_region
  service_account = google_service_account.trigger_sa.id
  filename        = var.cloudbuild_yaml_path
  substitutions   = merge(var.build_substitutions, {
    _REPO_NAME = google_artifact_registry_repository.repo.name
  })

  repository_event_config {
    repository = var.source_repository_id
    push {
      branch = "^${var.github_branch_name}$"
    }
  }

  included_files = var.included_files_glob
}

# --- Common IAM Bindings ---
resource "google_project_iam_member" "logging_writer_binding" {
  project = var.gcp_project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.trigger_sa.email}"
}

resource "google_artifact_registry_repository_iam_member" "ar_writer_binding" {
  location   = var.gcp_region
  repository = google_artifact_registry_repository.repo.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.trigger_sa.email}"
}

resource "google_cloud_run_v2_service_iam_member" "run_developer_binding" {
  name     = google_cloud_run_v2_service.this.name
  location = google_cloud_run_v2_service.this.location
  role     = "roles/run.developer"
  member   = "serviceAccount:${google_service_account.trigger_sa.email}"
}

resource "google_service_account_iam_member" "run_sa_user_binding" {
  service_account_id = google_service_account.run_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.trigger_sa.email}"
}

resource "google_project_iam_member" "aiplatform_user_binding" {
  project = var.gcp_project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_project_iam_member" "storage_object_admin_binding" {
  project = var.gcp_project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_project_iam_member" "firestore_developer_binding" {
  project = var.gcp_project_id
  role    = "roles/firebase.developAdmin"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_project_iam_member" "sa_token_creator_binding" {
  project = var.gcp_project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "db_password_access" {
  secret_id = var.db_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

# This is required for the Cloud Run instance to talk to the Cloud SQL Auth Proxy
resource "google_project_iam_member" "cloudsql_client" {
  project = var.gcp_project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.run_sa.email}"
}

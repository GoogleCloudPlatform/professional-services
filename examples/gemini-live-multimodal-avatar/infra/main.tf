# Copyright 2026 Google LLC
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

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.11"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "google" {
  project               = var.project_id
  region                = var.region
  user_project_override = true
  billing_project       = var.project_id
}

# Firestore Database (Native Mode)
resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  delete_protection_state = "DELETE_PROTECTION_DISABLED"
  deletion_policy         = "DELETE"

  depends_on = [google_project_service.apis]
}

# Firestore TTL Policy for custom_scenarios
# Note: google_firestore_field is used to configure TTL on a specific field
resource "google_firestore_field" "custom_scenarios_ttl" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "custom_scenarios"
  field      = "expiresAt"

  ttl_config {} # Enables TTL on this field
}

# Artifact Registry Repository for Docker images
resource "google_artifact_registry_repository" "repo" {
  project       = var.project_id
  location      = var.region
  repository_id = local.full_service_name
  description   = "Docker repository for the Live API Rewrite service."
  format        = "DOCKER"
}

# Wait for IAM role propagation before attempting to push Docker images
resource "time_sleep" "wait_for_iam" {
  create_duration = "30s"

  depends_on = [
    google_artifact_registry_repository.repo,
    google_project_iam_member.cloudbuild_storage_admin,
    google_project_iam_member.cloudbuild_artifact_registry_writer
  ]
}

# Build and Push Image using Cloud Build
resource "null_resource" "build_image" {
  triggers = {
    backend_go      = sha1(join("", [for f in fileset("${path.module}/../backend", "**/*.go") : filesha1("${path.module}/../backend/${f}")]))
    backend_mod     = filesha1("${path.module}/../backend/go.mod")
    frontend_src    = sha1(join("", [for f in fileset("${path.module}/../frontend/src", "**") : filesha1("${path.module}/../frontend/src/${f}")]))
    frontend_public = sha1(join("", [for f in fileset("${path.module}/../frontend/public", "**") : filesha1("${path.module}/../frontend/public/${f}")]))
    frontend_html   = filesha1("${path.module}/../frontend/index.html")
    package_json    = filesha1("${path.module}/../frontend/package.json")
    dockerfile      = filesha1("${path.module}/../Dockerfile")
    cloudbuild      = filesha1("${path.module}/../cloudbuild.yaml")
  }

  provisioner "local-exec" {
    # Run from the project root directory
    working_dir = "${path.module}/.."
    command     = "gcloud builds submit --project=${var.project_id} --config cloudbuild.yaml --substitutions _REGION=${var.region},_REPOSITORY=${google_artifact_registry_repository.repo.repository_id},_IMAGE_NAME=${local.full_service_name} ."
  }

  depends_on = [
    time_sleep.wait_for_iam
  ]
}

# Cloud Run Service
resource "google_cloud_run_v2_service" "service" {
  project  = var.project_id
  name     = local.full_service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.app_sa.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}/${local.full_service_name}:latest"

      ports {
        container_port = 8080
      }

      env {
        name  = "HEYGEN_AVATAR_ID"
        value = var.heygen_avatar_id
      }

      env {
        name  = "USE_VERTEX_AI"
        value = tostring(var.use_vertex_ai)
      }

      env {
        name = "GEMINI_LIVE_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_api_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "HEYGEN_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.heygen_api_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "VERTEX_PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "VERTEX_LOCATION"
        value = var.vertex_location
      }

      env {
        name  = "VERTEX_DATA_STORE_ID"
        value = google_discovery_engine_data_store.vertex_ds.data_store_id
      }

      env {
        name  = "VERTEX_ENGINE_ID"
        value = google_discovery_engine_search_engine.vertex_search.engine_id
      }

      env {
        name  = "VERTEX_SEARCH_LOCATION"
        value = google_discovery_engine_data_store.vertex_ds.location
      }

      env {
        name  = "GOOGLE_AI_MODEL"
        value = var.google_ai_model
      }

      env {
        name  = "VERTEX_AI_MODEL"
        value = var.vertex_ai_model
      }

      env {
        name  = "VAD_SILENCE_DURATION_MS"
        value = tostring(var.vad_silence_duration_ms)
      }

      env {
        name  = "AVATAR_MODE"
        value = var.avatar_mode
      }
    }

    # We add an annotation based on the null_resource ID to ensure Cloud Run forces a new 
    # revision deployment only when the image is rebuilt due to source changes.
    annotations = {
      "source-hash" = null_resource.build_image.id
    }
  }

  depends_on = [
    null_resource.build_image,
    google_secret_manager_secret_iam_member.gemini_secret_access,
    google_secret_manager_secret_iam_member.heygen_secret_access,
    google_project_iam_member.app_discovery_engine_viewer,
    google_project_iam_member.app_vertex_ai_user,
    google_project_iam_member.app_firestore_user
  ]
}

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

data "google_project" "project" {
  project_id = var.project_id
}

locals {
  # Suffix logic for names
  full_service_name = var.name_suffix != "" ? "${var.service_name}-${var.name_suffix}" : var.service_name

  # The default Compute Engine service account is used by Cloud Build
  cloudbuild_sa = "${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

# ---------------------------------------------------------------------------------------------------------------------
# CUSTOM SERVICE ACCOUNT FOR CLOUD RUN
# ---------------------------------------------------------------------------------------------------------------------

resource "google_service_account" "app_sa" {
  project      = var.project_id
  account_id   = "${local.full_service_name}-sa"
  display_name = "Service Account for ${var.service_name}"
}

# Runtime Permissions
resource "google_project_iam_member" "app_vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

resource "google_project_iam_member" "app_discovery_engine_viewer" {
  project = var.project_id
  role    = "roles/discoveryengine.viewer"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

resource "google_project_iam_member" "app_firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

resource "google_project_iam_member" "app_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

# ---------------------------------------------------------------------------------------------------------------------
# BUILD SERVICE ACCOUNT PERMISSIONS (CLOUD BUILD)
# ---------------------------------------------------------------------------------------------------------------------

# Allow Cloud Build to read from staging buckets
resource "google_project_iam_member" "cloudbuild_storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${local.cloudbuild_sa}"
}

# Allow Cloud Build to push images
resource "google_project_iam_member" "cloudbuild_artifact_registry_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${local.cloudbuild_sa}"
}

# Allow Cloud Build to act as the App Service Account for deployment
resource "google_service_account_iam_member" "cloudbuild_as_app_sa" {
  service_account_id = google_service_account.app_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${local.cloudbuild_sa}"
}

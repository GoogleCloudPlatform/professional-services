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

# Dedicated runtime service account for Cloud Run service
resource "google_service_account" "converter_sa" {
  account_id   = "agent-builder-adk-sa"
  display_name = "Agent Builder to ADK Converter Service Account"
  description  = "Dedicated runtime identity for Agent Builder to ADK Converter Cloud Run service"
  project      = var.project_id
}

# Least-privilege IAM binding: write logs to Cloud Logging
resource "google_project_iam_member" "logging_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.converter_sa.email}"
}

# Least-privilege IAM binding: pull container images from Artifact Registry
resource "google_project_iam_member" "artifact_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.converter_sa.email}"
}

# Optional unauthenticated invoker binding (gated by allow_unauthenticated variable)
resource "google_cloud_run_v2_service_iam_member" "invoker" {
  count    = var.allow_unauthenticated ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.converter_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

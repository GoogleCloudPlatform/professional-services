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

# 1. Creates the Firebase Hosting site to deploy to
resource "google_firebase_hosting_site" "this" {
  provider = google-beta
  project = var.firebase_project_id
  site_id = var.service_name
}

# 2. Create a dedicated Service Account for the frontend trigger
resource "google_service_account" "trigger_sa" {
  account_id   = "${var.resource_prefix}-${var.environment}-trig"
  display_name = "SA for ${var.service_name} Trigger (${var.environment})"
}

# 3. Create the build trigger
resource "google_cloudbuild_trigger" "this" {
  name            = "${var.service_name}-trigger"
  location        = var.gcp_region
  service_account = google_service_account.trigger_sa.id
  filename        = var.cloudbuild_yaml_path
  substitutions   = var.build_substitutions

  repository_event_config {
    repository = var.source_repository_id # Uses the ID passed from the platform
    push {
      branch = "^${var.github_branch_name}$"
    }
  }

  included_files = var.included_files_glob
}

# 4. Give the trigger SA permission to deploy to Firebase Hosting
resource "google_project_iam_member" "firebase_admin" {
  project = var.gcp_project_id
  role    = "roles/firebasehosting.admin"
  member  = "serviceAccount:${google_service_account.trigger_sa.email}"
}

# 5. Give the trigger SA permission to write logs
resource "google_project_iam_member" "logging_writer" {
  project = var.gcp_project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.trigger_sa.email}"
}

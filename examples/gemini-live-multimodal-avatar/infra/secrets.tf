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

resource "google_secret_manager_secret" "gemini_api_key" {
  project   = var.project_id
  secret_id = "GEMINI_LIVE_API_KEY"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "gemini_api_key_version" {
  secret      = google_secret_manager_secret.gemini_api_key.id
  secret_data = "dummy-gemini-key"

  lifecycle {
    ignore_changes = [
      secret_data
    ]
  }
}

resource "google_secret_manager_secret" "heygen_api_key" {
  project   = var.project_id
  secret_id = "HEYGEN_API_KEY"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "heygen_api_key_version" {
  secret      = google_secret_manager_secret.heygen_api_key.id
  secret_data = "dummy-heygen-key"

  lifecycle {
    ignore_changes = [
      secret_data
    ]
  }
}

# Grant the Custom Service Account access to read these secrets.
resource "google_secret_manager_secret_iam_member" "gemini_secret_access" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.gemini_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.app_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "heygen_secret_access" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.heygen_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.app_sa.email}"
}

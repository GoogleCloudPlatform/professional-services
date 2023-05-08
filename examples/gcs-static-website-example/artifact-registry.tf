#    Copyright 2023 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

resource "google_artifact_registry_repository" "image-repo" {
  location      = var.region
  repository_id = "image-repo"
  description   = "Docker repository"
  format        = "DOCKER"
  depends_on = [google_project_service.apis]
}

resource "google_artifact_registry_repository_iam_member" "member" {
  project = google_artifact_registry_repository.image-repo.project
  location = google_artifact_registry_repository.image-repo.location
  repository = google_artifact_registry_repository.image-repo.name
  role = "roles/artifactregistry.reader"
  member = "serviceAccount:${google_service_account.gce_sa.email}"
}
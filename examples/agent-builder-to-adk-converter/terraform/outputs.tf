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

output "cloud_run_url" {
  description = "The URL of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.converter_service.uri
}

output "artifact_registry_id" {
  description = "The ID of the Artifact Registry repository"
  value       = google_artifact_registry_repository.converter_repo.id
}

output "artifact_registry_repository_name" {
  description = "The name of the Artifact Registry repository"
  value       = google_artifact_registry_repository.converter_repo.name
}

output "service_account_email" {
  description = "The email address of the dedicated Cloud Run runtime service account"
  value       = google_service_account.converter_sa.email
}

output "service_name" {
  description = "The name of the deployed Cloud Run v2 service"
  value       = google_cloud_run_v2_service.converter_service.name
}

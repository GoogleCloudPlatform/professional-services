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

output "artifact_registry_repository_url" {
  description = "The URL of the Artifact Registry repository"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}"
}

output "cloud_run_service_url" {
  description = "The URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.service.uri
}

output "cloud_run_service_name" {
  description = "The name of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.service.name
}

output "vertex_project_id" {
  description = "The GCP Project ID for Vertex AI Search"
  value       = var.project_id
}

output "vertex_location" {
  description = "The location for Vertex AI Search"
  value       = var.vertex_location
}

output "vertex_search_location" {
  description = "The location for Vertex AI Search (specifically Discovery Engine)"
  value       = var.vertex_search_location
}

output "vertex_data_store_id" {
  description = "The Data Store ID for Vertex AI Search"
  value       = google_discovery_engine_data_store.vertex_ds.data_store_id
}

output "vertex_engine_id" {
  description = "The Engine ID for Vertex AI Search"
  value       = google_discovery_engine_search_engine.vertex_search.engine_id
}

output "data_bucket_url" {
  description = "The GCS bucket URL for uploading data"
  value       = google_storage_bucket.data_bucket.url
}

output "firebase_api_key" {
  description = "Firebase API Key"
  value       = nonsensitive(data.google_firebase_web_app_config.default.api_key)
}

output "firebase_auth_domain" {
  description = "Firebase Auth Domain"
  value       = data.google_firebase_web_app_config.default.auth_domain
}

output "firebase_project_id" {
  description = "Firebase Project ID"
  value       = var.project_id
}

output "firebase_app_id" {
  description = "Firebase App ID"
  value       = google_firebase_web_app.default.app_id
}

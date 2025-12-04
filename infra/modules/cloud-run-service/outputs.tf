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

output "service_url" {
  description = "The URL of the deployed Cloud Run service."
  value       = google_cloud_run_v2_service.this.uri
}

output "trigger_sa_email" {
  description = "The email of the service account used by the build trigger."
  value       = google_service_account.trigger_sa.email
}

output "service_name" {
  description = "The name of the Cloud Run service."
  value       = google_cloud_run_v2_service.this.name
}

output "location" {
  description = "The location of the Cloud Run service."
  value       = google_cloud_run_v2_service.this.location
}

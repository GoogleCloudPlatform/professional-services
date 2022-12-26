# Copyright 2022 Google LLC
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


output "impersonate_service_account_email" {
  description = "Service account to be impersonated by workload identity."
  value       = module.sa-tfe.email
}

output "project_id" {
  description = "GCP Project ID."
  value       = module.project.project_id
}

output "workload_identity_audience" {
  description = "TFC Workload Identity Audience."
  value       = "//iam.googleapis.com/${google_iam_workload_identity_pool_provider.tfe-pool-provider.name}"
}

output "workload_identity_pool_provider_id" {
  description = "GCP workload identity pool provider ID."
  value       = google_iam_workload_identity_pool_provider.tfe-pool-provider.name
}

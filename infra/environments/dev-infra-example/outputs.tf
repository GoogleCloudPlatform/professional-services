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

output "gcp_project_id" {
  description = "The GCP project ID for this environment."
  value       = var.gcp_project_id
}

output "frontend_secrets" {
  description = "A list of frontend secret names."
  value       = var.frontend_secrets
}

output "backend_secrets" {
  description = "A list of backend secret names."
  value       = var.backend_secrets
}

output "cloud_sql_connection_name" {
  description = "The connection name of the Cloud SQL instance to be used by the bootstrap script."
  value       = module.creative_studio_platform.cloud_sql_connection_name
}

# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

output "cloud_run_url" {
  value       = google_cloud_run_v2_service.asop_service.uri
  description = "The direct HTTPS URL of the Cloud Run service."
}

output "load_balancer_ip" {
  value       = local.use_iap ? google_compute_global_address.lb_ip[0].address : ""
  description = "The static IP address assigned to the HTTPS Load Balancer when IAP is enabled."
}

output "app_url" {
  value       = local.use_iap ? (var.domain_name != "" ? "https://${var.domain_name}" : "https://${google_compute_global_address.lb_ip[0].address}") : google_cloud_run_v2_service.asop_service.uri
  description = "The URL to access ASOP Studio."
}

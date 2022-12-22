/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

output "id" {
  description = "DataFusion instance ID."
  value       = google_data_fusion_instance.default.id
}

output "ip_allocation" {
  description = "IP range reserved for Data Fusion instance in case of a private instance."
  value       = local.ip_allocation
}

output "resource" {
  description = "DataFusion resource."
  value       = google_data_fusion_instance.default
}

output "service_account" {
  description = "DataFusion Service Account."
  value       = google_data_fusion_instance.default.service_account
}

output "service_endpoint" {
  description = "DataFusion Service Endpoint."
  value       = google_data_fusion_instance.default.service_endpoint
}

output "version" {
  description = "DataFusion version."
  value       = google_data_fusion_instance.default.version
}

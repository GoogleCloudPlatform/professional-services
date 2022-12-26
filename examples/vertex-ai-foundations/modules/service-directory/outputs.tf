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

output "endpoints" {
  description = "Endpoint resources."
  value       = google_service_directory_endpoint.default
}

output "id" {
  description = "Namespace id (short name)."
  value       = google_service_directory_namespace.default.id
}

output "name" {
  description = "Namespace name (long name)."
  value       = google_service_directory_namespace.default.name
}

output "namespace" {
  description = "Namespace resource."
  value       = google_service_directory_namespace.default
  depends_on = [
    google_service_directory_namespace_iam_binding.default
  ]
}

output "service_id" {
  description = "Service ids (short names)."
  value = {
    for k, v in google_service_directory_service.default : k => v.id
  }
  depends_on = [
    google_service_directory_service_iam_binding.default
  ]
}

output "service_names" {
  description = "Service ids (long names)."
  value = {
    for k, v in google_service_directory_service.default : k => v.name
  }
  depends_on = [
    google_service_directory_service_iam_binding.default
  ]
}

output "services" {
  description = "Service resources."
  value       = google_service_directory_service.default
  depends_on = [
    google_service_directory_service_iam_binding.default
  ]
}

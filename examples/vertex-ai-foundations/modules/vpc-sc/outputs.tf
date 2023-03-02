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

output "access_level_names" {
  description = "Access level resources."
  value = {
    for k, v in google_access_context_manager_access_level.basic :
    k => v.name
  }
}

output "access_levels" {
  description = "Access level resources."
  value       = google_access_context_manager_access_level.basic
}

output "access_policy" {
  description = "Access policy resource, if autocreated."
  value       = try(google_access_context_manager_access_policy.default.0, null)
}

output "access_policy_name" {
  description = "Access policy name."
  value       = local.access_policy
}

output "service_perimeters_bridge" {
  description = "Bridge service perimeter resources."
  value       = google_access_context_manager_service_perimeter.bridge
}

output "service_perimeters_regular" {
  description = "Regular service perimeter resources."
  value       = google_access_context_manager_service_perimeter.regular
}

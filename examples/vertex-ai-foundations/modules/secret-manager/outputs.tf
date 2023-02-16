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

output "ids" {
  description = "Secret ids keyed by secret_ids (names)."
  value = {
    for k, v in google_secret_manager_secret.default : v.secret_id => v.id
  }
}

output "secrets" {
  description = "Secret resources."
  value       = google_secret_manager_secret.default
}

output "version_ids" {
  description = "Version ids keyed by secret name : version name."
  value = {
    for k, v in google_secret_manager_secret_version.default : k => v.id
  }
}

output "versions" {
  description = "Secret versions."
  value       = google_secret_manager_secret_version.default
  sensitive   = true
}

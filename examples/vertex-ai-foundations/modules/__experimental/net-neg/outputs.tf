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
  description = "Network endpoint group ID."
  value       = google_compute_network_endpoint_group.group.name
}

output "size" {
  description = "Size of the network endpoint group."
  value       = google_compute_network_endpoint_group.group.size
}

output "self_lnk" {
  description = "Network endpoint group self link."
  value       = google_compute_network_endpoint_group.group.self_link
}

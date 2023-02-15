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
output "bgpsession" {
  description = "bgp session."
  value       = google_compute_router_peer.peer
}

output "interconnect_attachment" {
  description = "interconnect attachment."
  value       = google_compute_interconnect_attachment.interconnect_vlan_attachment
}

output "router" {
  description = "Router resource (only if auto-created)."
  value       = google_compute_router.router
}



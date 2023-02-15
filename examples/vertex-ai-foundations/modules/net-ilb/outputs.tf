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

output "backend_service" {
  description = "Backend resource."
  value       = google_compute_region_backend_service.default
}

output "backend_service_id" {
  description = "Backend id."
  value       = google_compute_region_backend_service.default.id
}

output "backend_service_self_link" {
  description = "Backend self link."
  value       = google_compute_region_backend_service.default.self_link
}

output "forwarding_rule" {
  description = "Forwarding rule resource."
  value       = google_compute_forwarding_rule.default
}

output "forwarding_rule_address" {
  description = "Forwarding rule address."
  value       = google_compute_forwarding_rule.default.ip_address
}

output "forwarding_rule_id" {
  description = "Forwarding rule id."
  value       = google_compute_forwarding_rule.default.id
}

output "forwarding_rule_self_link" {
  description = "Forwarding rule self link."
  value       = google_compute_forwarding_rule.default.self_link
}

output "groups" {
  description = "Optional unmanaged instance group resources."
  value       = google_compute_instance_group.unmanaged
}

output "group_self_links" {
  description = "Optional unmanaged instance group self links."
  value = {
    for k, v in google_compute_instance_group.unmanaged : k => v.self_link
  }
}

output "health_check" {
  description = "Auto-created health-check resource."
  value       = try(google_compute_health_check.default.0, null)
}

output "health_check_self_id" {
  description = "Auto-created health-check self id."
  value       = try(google_compute_health_check.default.0.id, null)
}

output "health_check_self_link" {
  description = "Auto-created health-check self link."
  value       = try(google_compute_health_check.default.0.self_link, null)
}

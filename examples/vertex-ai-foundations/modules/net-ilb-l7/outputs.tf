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

output "health_checks" {
  description = "Health-check resources."
  value       = try(google_compute_region_health_check.health_check, [])
}

output "backend_services" {
  description = "Backend service resources."
  value = {
    group = try(google_compute_region_backend_service.backend_service, [])
  }
}

output "url_map" {
  description = "The url-map."
  value       = try(google_compute_region_url_map.url_map, null)
}

output "ssl_certificate_link_ids" {
  description = "The SSL certificate."
  value = {
    for k, v in google_compute_region_ssl_certificate.certificates : k => v.self_link
  }
}

output "ip_address" {
  description = "The reserved IP address."
  value       = try(google_compute_forwarding_rule.forwarding_rule.ip_address, null)
}

output "target_proxy" {
  description = "The target proxy."
  value = try(
    google_compute_region_target_https_proxy.https.0,
    google_compute_region_target_http_proxy.http.0,
    []
  )
}

output "forwarding_rule" {
  description = "The forwarding rule."
  value       = try(google_compute_forwarding_rule.forwarding_rule, null)
}

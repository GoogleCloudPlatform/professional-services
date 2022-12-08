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
  value       = try(google_compute_health_check.health_check, [])
}

output "backend_services" {
  description = "Backend service resources."
  value = {
    bucket = try(google_compute_backend_bucket.bucket, [])
    group  = try(google_compute_backend_service.group, [])
  }
}

output "url_map" {
  description = "The url-map."
  value       = google_compute_url_map.url_map
}

output "ssl_certificates" {
  description = "The SSL certificate."
  value = try(
    google_compute_managed_ssl_certificate.managed,
    google_compute_ssl_certificate.unmanaged,
    null
  )
}

output "ip_address" {
  description = "The reserved global IP address."
  value       = var.region == null ? try(google_compute_global_address.static_ip.0.address, null) : try(google_compute_address.static_ip.0.address, null)
}

output "ip_address_self_link" {
  description = "The URI of the reserved global IP address."
  value       = var.region == null ? google_compute_global_forwarding_rule.forwarding_rule.0.ip_address : google_compute_forwarding_rule.forwarding_rule.0.ip_address
}

output "target_proxy" {
  description = "The target proxy."
  value = try(
    google_compute_target_http_proxy.http,
    google_compute_target_https_proxy.https
  )
}

output "global_forwarding_rule" {
  description = "The global forwarding rule."
  value       = var.region == null ? google_compute_global_forwarding_rule.forwarding_rule.0 : null
}

output "forwarding_rule" {
  description = "The regional forwarding rule."
  value       = var.region == null ? google_compute_global_forwarding_rule.forwarding_rule.0 : google_compute_forwarding_rule.forwarding_rule.0
}

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

output "name" {
  description = "Name of the Cloud NAT."
  value       = google_compute_router_nat.nat.name
}

output "nat_ip_allocate_option" {
  description = "NAT IP allocation mode."
  value       = google_compute_router_nat.nat.nat_ip_allocate_option
}

output "region" {
  description = "Cloud NAT region."
  value       = google_compute_router_nat.nat.region
}

output "router" {
  description = "Cloud NAT router resources (if auto created)."
  value = (
    var.router_create
    ? try(google_compute_router.router[0], null)
    : null
  )
}

output "router_name" {
  description = "Cloud NAT router name."
  value       = local.router_name
}

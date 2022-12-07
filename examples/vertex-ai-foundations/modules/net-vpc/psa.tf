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

# tfdoc:file:description Private Service Access resources.

locals {
  psa_config_ranges = try(var.psa_config.ranges, {})
}

resource "google_compute_global_address" "psa_ranges" {
  for_each      = local.psa_config_ranges
  project       = var.project_id
  name          = each.key
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  address       = split("/", each.value)[0]
  prefix_length = split("/", each.value)[1]
  network       = local.network.id
}

resource "google_service_networking_connection" "psa_connection" {
  for_each = var.psa_config != null ? { 1 = 1 } : {}
  network  = local.network.id
  service  = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [
    for k, v in google_compute_global_address.psa_ranges : v.name
  ]
}

resource "google_compute_network_peering_routes_config" "psa_routes" {
  for_each             = var.psa_config != null ? { 1 = 1 } : {}
  project              = var.project_id
  peering              = google_service_networking_connection.psa_connection["1"].peering
  network              = local.network.name
  export_custom_routes = var.psa_config.export_routes
  import_custom_routes = var.psa_config.import_routes
}

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

# tfdoc:file:description IP Address and forwarding rule.

locals {
  ip_address = (
    var.static_ip_config.reserve
    ? google_compute_address.static_ip.0.id
    : null
  )

  port_range = coalesce(
    var.forwarding_rule_config.port_range,
    var.https ? "443" : "80"
  )

  target = (
    var.https
    ? google_compute_region_target_https_proxy.https.0.id
    : google_compute_region_target_http_proxy.http.0.id
  )
}

resource "google_compute_address" "static_ip" {
  count        = var.static_ip_config.reserve ? 1 : 0
  provider     = google-beta
  name         = var.name
  project      = var.project_id
  description  = "Terraform managed."
  address_type = "INTERNAL"
  address      = try(var.static_ip_config.options.address, null)
  purpose      = "GCE_ENDPOINT"
  region       = try(var.region, null)
  subnetwork   = try(var.static_ip_config.options.subnet, var.subnetwork, null)
}

resource "google_compute_forwarding_rule" "forwarding_rule" {
  provider              = google-beta
  name                  = var.name
  project               = var.project_id
  description           = "Terraform managed."
  ip_address            = local.ip_address
  ip_protocol           = "TCP"
  labels                = try(var.forwarding_rule_config.labels, {})
  load_balancing_scheme = "INTERNAL_MANAGED"
  network               = try(var.forwarding_rule_config.network, null)
  network_tier          = var.forwarding_rule_config.network_tier
  port_range            = local.port_range
  ports                 = []
  region                = try(var.region, null)
  service_label         = try(var.forwarding_rule_config.service_label, null)
  subnetwork            = try(var.subnetwork, null)
  target                = local.target
}

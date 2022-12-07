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

# tfdoc:file:description Global address and forwarding rule.

locals {
  regional_ip_address = var.region != null ? (
    var.reserve_ip_address
    ? google_compute_address.static_ip.0.id
    : null
  ) : null

  regional_port_range = coalesce(
    var.forwarding_rule_config.port_range,
    var.https ? "443" : "80"
  )

  regional_target = var.region != null ? (
    var.https
    ? google_compute_region_target_https_proxy.https.0.id
    : google_compute_region_target_http_proxy.http.0.id
  ) : null
}

resource "google_compute_address" "static_ip" {
  count        = var.region != null && var.reserve_ip_address ? 1 : 0
  provider     = google-beta
  name         = var.name
  project      = var.project_id
  region       = var.region
  description  = "Terraform managed."
  address_type = "EXTERNAL"
}

resource "google_compute_forwarding_rule" "forwarding_rule" {
  count                 = var.region != null ? 1 : 0
  provider              = google-beta
  name                  = var.name
  project               = var.project_id
  region                = var.region
  description           = "Terraform managed."
  ip_protocol           = var.forwarding_rule_config.ip_protocol
  load_balancing_scheme = var.forwarding_rule_config.load_balancing_scheme
  port_range            = local.regional_port_range
  target                = local.regional_target
  ip_address            = local.regional_ip_address
  network_tier          = var.forwarding_rule_config.network_tier
  network               = var.forwarding_rule_config.network
}

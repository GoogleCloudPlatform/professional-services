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

locals {
  gateway_address = (
    var.gateway_address_create
    ? google_compute_address.gateway[0].address
    : var.gateway_address
  )
  route_pairs = {
    for pair in setproduct(keys(var.tunnels), var.remote_ranges) :
    "${pair[0]}-${join("-", regexall("[0-9]+", pair[1]))}" => {
      tunnel = pair[0], range = pair[1]
    }
  }
  secret = random_id.secret.b64_url
}

resource "google_compute_address" "gateway" {
  count   = var.gateway_address_create ? 1 : 0
  name    = "vpn-${var.name}"
  project = var.project_id
  region  = var.region
}

resource "google_compute_forwarding_rule" "esp" {
  name        = "vpn-${var.name}-esp"
  project     = var.project_id
  region      = var.region
  target      = google_compute_vpn_gateway.gateway.self_link
  ip_address  = local.gateway_address
  ip_protocol = "ESP"
}

resource "google_compute_forwarding_rule" "udp-500" {
  name        = "vpn-${var.name}-udp-500"
  project     = var.project_id
  region      = var.region
  target      = google_compute_vpn_gateway.gateway.self_link
  ip_address  = local.gateway_address
  ip_protocol = "UDP"
  port_range  = "500"
}

resource "google_compute_forwarding_rule" "udp-4500" {
  name        = "vpn-${var.name}-udp-4500"
  project     = var.project_id
  region      = var.region
  target      = google_compute_vpn_gateway.gateway.self_link
  ip_address  = local.gateway_address
  ip_protocol = "UDP"
  port_range  = "4500"
}

resource "google_compute_route" "route" {
  for_each            = local.route_pairs
  name                = "vpn-${var.name}-${each.key}"
  project             = var.project_id
  network             = var.network
  dest_range          = each.value.range
  priority            = var.route_priority
  next_hop_vpn_tunnel = google_compute_vpn_tunnel.tunnels[each.value.tunnel].self_link
}

resource "google_compute_vpn_gateway" "gateway" {
  name    = var.name
  project = var.project_id
  region  = var.region
  network = var.network
}

resource "google_compute_vpn_tunnel" "tunnels" {
  for_each                = var.tunnels
  name                    = "${var.name}-${each.key}"
  project                 = var.project_id
  region                  = var.region
  peer_ip                 = each.value.peer_ip
  local_traffic_selector  = each.value.traffic_selectors.local
  remote_traffic_selector = each.value.traffic_selectors.remote
  ike_version             = each.value.ike_version
  shared_secret           = each.value.shared_secret == "" ? local.secret : each.value.shared_secret
  target_vpn_gateway      = google_compute_vpn_gateway.gateway.self_link
  depends_on              = [google_compute_forwarding_rule.esp]
}

resource "random_id" "secret" {
  byte_length = 8
}

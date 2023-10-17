/**
 * Copyright 2023 Google LLC
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

# GCP existing network
data "google_compute_network" "gcp_vpn_network" {
  name = var.gcp_vpc_name
}

resource "google_compute_router" "vpn_router" {
  name    = "vpn-router"
  network = var.gcp_vpc_name

  bgp {
    asn               = var.gcp_bgp_asn
    advertise_mode    = "CUSTOM"
    advertised_groups = ["ALL_SUBNETS"]
  }
}

# GCP HA VPN gateway
resource "google_compute_ha_vpn_gateway" "target_gateway" {
  name    = "vpn-gcp-azure"
  network = var.gcp_vpc_name
}

resource "google_compute_external_vpn_gateway" "azure_gateway" {
  name            = "azure-gateway"
  redundancy_type = "TWO_IPS_REDUNDANCY"
  description     = "VPN gateway on Azure side"

  interface {
    id         = 0
    ip_address = azurerm_public_ip.azure_vpn_gateway_public_ip_1.ip_address
  }

  interface {
    id         = 1
    ip_address = azurerm_public_ip.azure_vpn_gateway_public_ip_2.ip_address
  }
}

# GCP HA VPN Tunnels
resource "google_compute_vpn_tunnel" "tunnel_1" {
  name                            = "ha-azure-vpn-tunnel-1"
  vpn_gateway                     = google_compute_ha_vpn_gateway.target_gateway.self_link
  shared_secret                   = var.shared_secret
  peer_external_gateway           = google_compute_external_vpn_gateway.azure_gateway.self_link
  peer_external_gateway_interface = 0
  router                          = google_compute_router.vpn_router.name
  ike_version                     = 2
  vpn_gateway_interface           = 0
}

resource "google_compute_vpn_tunnel" "tunnel_2" {
  name                            = "ha-azure-vpn-tunnel-2"
  vpn_gateway                     = google_compute_ha_vpn_gateway.target_gateway.self_link
  shared_secret                   = var.shared_secret
  peer_external_gateway           = google_compute_external_vpn_gateway.azure_gateway.self_link
  peer_external_gateway_interface = 1
  router                          = google_compute_router.vpn_router.name
  ike_version                     = 2
  vpn_gateway_interface           = 1
}

resource "google_compute_router_interface" "router1_interface1" {
  name       = "interface-1"
  router     = google_compute_router.vpn_router.name
  ip_range   = "169.254.21.2/30"
  vpn_tunnel = google_compute_vpn_tunnel.tunnel_1.name
}

resource "google_compute_router_peer" "router1_peer1" {
  name                      = "peer-1"
  router                    = google_compute_router.vpn_router.name
  peer_ip_address           = "169.254.21.1"
  peer_asn                  = "65515"
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.router1_interface1.name
}

resource "google_compute_router_interface" "router1_interface2" {
  name       = "interface-2"
  router     = google_compute_router.vpn_router.name
  ip_range   = "169.254.22.2/30"
  vpn_tunnel = google_compute_vpn_tunnel.tunnel_2.name
}

resource "google_compute_router_peer" "router1_peer2" {
  name                      = "peer-2"
  router                    = google_compute_router.vpn_router.name
  peer_ip_address           = "169.254.22.1"
  peer_asn                  = "65515"
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.router1_interface2.name
}
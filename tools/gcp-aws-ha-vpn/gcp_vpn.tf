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

# Routing specs

data "google_compute_network" "gcp_vpn_network" {
  name = var.gcp_network
}

resource "google_compute_router" "vpn_router" {
  name    = "vpn-router"
  network = var.gcp_network

  bgp {
    asn               = var.gcp_bgp
    advertise_mode    = "CUSTOM"
    advertised_groups = ["ALL_SUBNETS"]

    # advertised_ip_ranges {
    #   range = "35.199.192.0/19"
    #   description = "Cloud DNS Managed Private Zone Forwarding"
    # }
  }
}

# VPN specs

resource "google_compute_ha_vpn_gateway" "target_gateway" {
  name    = "vpn-aws"
  network = var.gcp_network
}

resource "google_compute_external_vpn_gateway" "aws_gateway" {
  name            = "aws-gateway"
  redundancy_type = "FOUR_IPS_REDUNDANCY"
  description     = "VPN gateway on AWS side"

  interface {
    id         = 0
    ip_address = aws_vpn_connection.cx_1.tunnel1_address
  }

  interface {
    id         = 1
    ip_address = aws_vpn_connection.cx_1.tunnel2_address
  }

  interface {
    id         = 2
    ip_address = aws_vpn_connection.cx_2.tunnel1_address
  }

  interface {
    id         = 3
    ip_address = aws_vpn_connection.cx_2.tunnel2_address
  }
}

resource "google_compute_vpn_tunnel" "vpn_tunnel_1" {
  name                            = "vpn-tunnel-1"
  vpn_gateway                     = google_compute_ha_vpn_gateway.target_gateway.self_link
  shared_secret                   = aws_vpn_connection.cx_1.tunnel1_preshared_key
  peer_external_gateway           = google_compute_external_vpn_gateway.aws_gateway.self_link
  peer_external_gateway_interface = 0
  router                          = google_compute_router.vpn_router.name
  ike_version                     = 2
  vpn_gateway_interface           = 0
}

resource "google_compute_vpn_tunnel" "vpn_tunnel_2" {
  name                            = "vpn-tunnel-2"
  vpn_gateway                     = google_compute_ha_vpn_gateway.target_gateway.self_link
  shared_secret                   = aws_vpn_connection.cx_1.tunnel2_preshared_key
  peer_external_gateway           = google_compute_external_vpn_gateway.aws_gateway.self_link
  peer_external_gateway_interface = 1
  router                          = google_compute_router.vpn_router.name
  ike_version                     = 2
  vpn_gateway_interface           = 0
}

resource "google_compute_vpn_tunnel" "vpn_tunnel_3" {
  name                            = "vpn-tunnel-3"
  vpn_gateway                     = google_compute_ha_vpn_gateway.target_gateway.self_link
  shared_secret                   = aws_vpn_connection.cx_2.tunnel1_preshared_key
  peer_external_gateway           = google_compute_external_vpn_gateway.aws_gateway.self_link
  peer_external_gateway_interface = 2
  router                          = google_compute_router.vpn_router.name
  ike_version                     = 2
  vpn_gateway_interface           = 1
}

resource "google_compute_vpn_tunnel" "vpn_tunnel_4" {
  name                            = "vpn-tunnel-4"
  vpn_gateway                     = google_compute_ha_vpn_gateway.target_gateway.self_link
  shared_secret                   = aws_vpn_connection.cx_2.tunnel2_preshared_key
  peer_external_gateway           = google_compute_external_vpn_gateway.aws_gateway.self_link
  peer_external_gateway_interface = 3
  router                          = google_compute_router.vpn_router.name
  ike_version                     = 2
  vpn_gateway_interface           = 1
}


resource "google_compute_router_interface" "vpn_int_1" {
  name       = "interface-1"
  router     = google_compute_router.vpn_router.name
  ip_range   = "${aws_vpn_connection.cx_1.tunnel1_cgw_inside_address}/30"
  vpn_tunnel = google_compute_vpn_tunnel.vpn_tunnel_1.name
}

resource "google_compute_router_interface" "vpn_int_2" {
  name       = "interface-2"
  router     = google_compute_router.vpn_router.name
  ip_range   = "${aws_vpn_connection.cx_1.tunnel2_cgw_inside_address}/30"
  vpn_tunnel = google_compute_vpn_tunnel.vpn_tunnel_2.name
}

resource "google_compute_router_interface" "vpn_int_3" {
  name       = "interface-3"
  router     = google_compute_router.vpn_router.name
  ip_range   = "${aws_vpn_connection.cx_2.tunnel1_cgw_inside_address}/30"
  vpn_tunnel = google_compute_vpn_tunnel.vpn_tunnel_3.name
}

resource "google_compute_router_interface" "vpn_int_4" {
  name       = "interface-4"
  router     = google_compute_router.vpn_router.name
  ip_range   = "${aws_vpn_connection.cx_2.tunnel2_cgw_inside_address}/30"
  vpn_tunnel = google_compute_vpn_tunnel.vpn_tunnel_4.name
}


resource "google_compute_router_peer" "vpn_peer_1" {
  name                      = "peer-1"
  router                    = google_compute_router.vpn_router.name
  peer_ip_address           = aws_vpn_connection.cx_1.tunnel1_vgw_inside_address
  peer_asn                  = aws_vpn_connection.cx_1.tunnel1_bgp_asn
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.vpn_int_1.name
}

resource "google_compute_router_peer" "vpn_peer_2" {
  name                      = "peer-2"
  router                    = google_compute_router.vpn_router.name
  peer_ip_address           = aws_vpn_connection.cx_1.tunnel2_vgw_inside_address
  peer_asn                  = aws_vpn_connection.cx_1.tunnel2_bgp_asn
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.vpn_int_2.name
}

resource "google_compute_router_peer" "vpn_peer_3" {
  name                      = "peer-3"
  router                    = google_compute_router.vpn_router.name
  peer_ip_address           = aws_vpn_connection.cx_2.tunnel1_vgw_inside_address
  peer_asn                  = aws_vpn_connection.cx_2.tunnel1_bgp_asn
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.vpn_int_3.name
}

resource "google_compute_router_peer" "vpn_peer_4" {
  name                      = "peer-4"
  router                    = google_compute_router.vpn_router.name
  peer_ip_address           = aws_vpn_connection.cx_2.tunnel2_vgw_inside_address
  peer_asn                  = aws_vpn_connection.cx_2.tunnel2_bgp_asn
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.vpn_int_4.name
}

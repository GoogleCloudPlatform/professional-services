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

output "gcp_vpn_gateway_ip1" {
  value       = google_compute_ha_vpn_gateway.target_gateway.vpn_interfaces.0.ip_address
  description = "GCP VPN Gateway IP address for the first VPN tunnel."
}

output "gcp_vpn_gateway_ip2" {
  value       = google_compute_ha_vpn_gateway.target_gateway.vpn_interfaces.1.ip_address
  description = "GCP VPN Gateway IP address for the second VPN tunnel."
}

output "gcp_peer_ip1" {
  value       = google_compute_router_peer.router1_peer1.ip_address
  description = "GCP BGP peer IP address for the first VPN tunnel."
}

output "gcp_peer_ip2" {
  value       = google_compute_router_peer.router1_peer2.ip_address
  description = "GCP BGP peer IP address for the second VPN tunnel."
}

output "azure_peer_ip1" {
  value       = azurerm_virtual_network_gateway.azure_vpn_gateway.bgp_settings.0.peering_addresses[0].apipa_addresses[0]
  description = "Azure BGP peer IP address for the first VPN tunnel."
}

output "azure_peer_ip2" {
  value       = azurerm_virtual_network_gateway.azure_vpn_gateway.bgp_settings.0.peering_addresses[1].apipa_addresses[0]
  description = "Azure BGP peer IP address for the second VPN tunnel."
}

output "azure_vpn_gateway_ip1" {
  value       = azurerm_public_ip.azure_vpn_gateway_public_ip_1.ip_address
  description = "Azure VPN Gateway Public IP address for the first VPN tunnel."
}

output "azure_vpn_gateway_ip2" {
  value       = azurerm_public_ip.azure_vpn_gateway_public_ip_2.ip_address
  description = "Azure VPN Gateway Public IP address for the second VPN tunnel."
}
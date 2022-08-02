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

output "gcp_gateway_ips" {
  value = google_compute_ha_vpn_gateway.target_gateway.vpn_interfaces.*.ip_address
}

output "aws_gateway_ips" {
  value = google_compute_external_vpn_gateway.aws_gateway.interface.*.ip_address
}

output "gcp_bgp_ips" {
  value = [google_compute_router_peer.vpn_peer_1.ip_address, google_compute_router_peer.vpn_peer_2.ip_address, google_compute_router_peer.vpn_peer_3.ip_address, google_compute_router_peer.vpn_peer_4.ip_address]
}

output "aws_bgp_ips" {
  value = [google_compute_router_peer.vpn_peer_1.peer_ip_address, google_compute_router_peer.vpn_peer_2.peer_ip_address, google_compute_router_peer.vpn_peer_3.peer_ip_address, google_compute_router_peer.vpn_peer_4.peer_ip_address]
}

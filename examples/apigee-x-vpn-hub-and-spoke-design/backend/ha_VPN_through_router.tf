# ### Each of the subnets will have a VPN Gateway connected to the same region inside the apigee-x-vpc using Cloud Router through HA VPN connection
# resource "google_compute_ha_vpn_gateway" "ha_gateway1" {
#   region   = "us-central1"
#   name     = "ha-vpn-1"
#   network  = google_compute_network.network1.id
# }

# resource "google_compute_ha_vpn_gateway" "ha_gateway2" {
#   region   = "us-central1"
#   name     = "ha-vpn-2"
#   network  = google_compute_network.network2.id
# }

# resource "google_compute_network" "network1" {
#   name                    = "network1"
#   routing_mode            = "GLOBAL"
#   auto_create_subnetworks = false
# }

# resource "google_compute_network" "network2" {
#   name                    = "network2"
#   routing_mode            = "GLOBAL"
#   auto_create_subnetworks = false
# }

# resource "google_compute_subnetwork" "network1_subnet1" {
#   name          = "ha-vpn-subnet-1"
#   ip_cidr_range = "10.0.1.0/24"
#   region        = "us-central1"
#   network       = google_compute_network.network1.id
# }

# resource "google_compute_subnetwork" "network1_subnet2" {
#   name          = "ha-vpn-subnet-2"
#   ip_cidr_range = "10.0.2.0/24"
#   region        = "us-west1"
#   network       = google_compute_network.network1.id
# }

# resource "google_compute_subnetwork" "network2_subnet1" {
#   name          = "ha-vpn-subnet-3"
#   ip_cidr_range = "192.168.1.0/24"
#   region        = "us-central1"
#   network       = google_compute_network.network2.id
# }

# resource "google_compute_subnetwork" "network2_subnet2" {
#   name          = "ha-vpn-subnet-4"
#   ip_cidr_range = "192.168.2.0/24"
#   region        = "us-east1"
#   network       = google_compute_network.network2.id
# }

# resource "google_compute_router" "router1" {
#   name     = "ha-vpn-router1"
#   network  = google_compute_network.network1.name
#   bgp {
#     asn = 64514
#   }
# }

# resource "google_compute_router" "router2" {
#   name     = "ha-vpn-router2"
#   network  = google_compute_network.network2.name
#   bgp {
#     asn = 64515
#   }
# }

# resource "google_compute_vpn_tunnel" "tunnel1" {
#   name                  = "ha-vpn-tunnel1"
#   region                = "us-central1"
#   vpn_gateway           = google_compute_ha_vpn_gateway.ha_gateway1.id
#   peer_gcp_gateway      = google_compute_ha_vpn_gateway.ha_gateway2.id
#   shared_secret         = "a secret message"
#   router                = google_compute_router.router1.id
#   vpn_gateway_interface = 0
# }

# resource "google_compute_vpn_tunnel" "tunnel2" {
#   name                  = "ha-vpn-tunnel2"
#   region                = "us-central1"
#   vpn_gateway           = google_compute_ha_vpn_gateway.ha_gateway1.id
#   peer_gcp_gateway      = google_compute_ha_vpn_gateway.ha_gateway2.id
#   shared_secret         = "a secret message"
#   router                = google_compute_router.router1.id
#   vpn_gateway_interface = 1
# }

# resource "google_compute_vpn_tunnel" "tunnel3" {
#   name                  = "ha-vpn-tunnel3"
#   region                = "us-central1"
#   vpn_gateway           = google_compute_ha_vpn_gateway.ha_gateway2.id
#   peer_gcp_gateway      = google_compute_ha_vpn_gateway.ha_gateway1.id
#   shared_secret         = "a secret message"
#   router                = google_compute_router.router2.id
#   vpn_gateway_interface = 0
# }

# resource "google_compute_vpn_tunnel" "tunnel4" {
#   name                  = "ha-vpn-tunnel4"
#   region                = "us-central1"
#   vpn_gateway           = google_compute_ha_vpn_gateway.ha_gateway2.id
#   peer_gcp_gateway      = google_compute_ha_vpn_gateway.ha_gateway1.id
#   shared_secret         = "a secret message"
#   router                = google_compute_router.router2.id
#   vpn_gateway_interface = 1
# }

# resource "google_compute_router_interface" "router1_interface1" {
#   name       = "router1-interface1"
#   router     = google_compute_router.router1.name
#   region     = "us-central1"
#   ip_range   = "169.254.0.1/30"
#   vpn_tunnel = google_compute_vpn_tunnel.tunnel1.name
# }

# resource "google_compute_router_peer" "router1_peer1" {
#   name                      = "router1-peer1"
#   router                    = google_compute_router.router1.name
#   region                    = "us-central1"
#   peer_ip_address           = "169.254.0.2"
#   peer_asn                  = 64515
#   advertised_route_priority = 100
#   interface                 = google_compute_router_interface.router1_interface1.name
# }

# resource "google_compute_router_interface" "router1_interface2" {
#   name       = "router1-interface2"
#   router     = google_compute_router.router1.name
#   region     = "us-central1"
#   ip_range   = "169.254.1.2/30"
#   vpn_tunnel = google_compute_vpn_tunnel.tunnel2.name
# }

# resource "google_compute_router_peer" "router1_peer2" {
#   name                      = "router1-peer2"
#   router                    = google_compute_router.router1.name
#   region                    = "us-central1"
#   peer_ip_address           = "169.254.1.1"
#   peer_asn                  = 64515
#   advertised_route_priority = 100
#   interface                 = google_compute_router_interface.router1_interface2.name
# }

# resource "google_compute_router_interface" "router2_interface1" {
#   name       = "router2-interface1"
#   router     = google_compute_router.router2.name
#   region     = "us-central1"
#   ip_range   = "169.254.0.2/30"
#   vpn_tunnel = google_compute_vpn_tunnel.tunnel3.name
# }

# resource "google_compute_router_peer" "router2_peer1" {
#   name                      = "router2-peer1"
#   router                    = google_compute_router.router2.name
#   region                    = "us-central1"
#   peer_ip_address           = "169.254.0.1"
#   peer_asn                  = 64514
#   advertised_route_priority = 100
#   interface                 = google_compute_router_interface.router2_interface1.name
# }

# resource "google_compute_router_interface" "router2_interface2" {
#   name       = "router2-interface2"
#   router     = google_compute_router.router2.name
#   region     = "us-central1"
#   ip_range   = "169.254.1.1/30"
#   vpn_tunnel = google_compute_vpn_tunnel.tunnel4.name
# }

# resource "google_compute_router_peer" "router2_peer2" {
#   name                      = "router2-peer2"
#   router                    = google_compute_router.router2.name
#   region                    = "us-central1"
#   peer_ip_address           = "169.254.1.2"
#   peer_asn                  = 64514
#   advertised_route_priority = 100
#   interface                 = google_compute_router_interface.router2_interface2.name
# }
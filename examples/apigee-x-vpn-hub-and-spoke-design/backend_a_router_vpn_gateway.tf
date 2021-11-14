resource "google_compute_ha_vpn_gateway" "backend_a_ha_gateway1" {
  region  = "us-east1"
  name    = "backend-a-ha-vpn-1"
  network = google_compute_network.apigee_network.id
  project = "${var.project_id}"
}

resource "google_compute_ha_vpn_gateway" "backend_a_ha_gateway2" {
  region  = "us-east1"
  name    = "backend-a-ha-vpn-2"
  network = "${var.backend_a_vpc}" #google_compute_network.backend_project_a_vpc.id
  project = "${var.backend_a_project_id}"
}

resource "google_compute_router" "backend_a_router1" {
  name    = "backend-a-ha-vpn-router1"
  network = google_compute_network.apigee_network.name
  project = "${var.project_id}"
  region  = "us-east1"
  bgp {
    asn = 64514
  }
}

resource "google_compute_router" "backend_a_router2" {
  name    = "backend-a-ha-vpn-router2"
  network = google_compute_network.backend_project_a_vpc.name
  project = "${var.backend_a_project_id}"
  region  = "us-east1"
  bgp {
    asn = 64515
  }
}

locals {
  secret = random_id.secret.b64_url
}

resource "google_compute_vpn_tunnel" "backend_a_tunnel1" {
  name                  = "backend-a-ha-vpn-tunnel1"
  project               = "${var.project_id}"
  region                = "us-east1"
  vpn_gateway           = google_compute_ha_vpn_gateway.backend_a_ha_gateway1.id
  peer_gcp_gateway      = google_compute_ha_vpn_gateway.backend_a_ha_gateway2.id
  shared_secret         = local.secret
  router                = google_compute_router.backend_a_router1.id
  vpn_gateway_interface = 0
}

resource "google_compute_vpn_tunnel" "backend_a_tunnel2" {
  name                  = "backend-a-ha-vpn-tunnel2"
  project               = "${var.project_id}"
  region                = "us-east1"
  vpn_gateway           = google_compute_ha_vpn_gateway.backend_a_ha_gateway1.id
  peer_gcp_gateway      = google_compute_ha_vpn_gateway.backend_a_ha_gateway2.id
  shared_secret         = local.secret
  router                = google_compute_router.backend_a_router1.id
  vpn_gateway_interface = 1
}

resource "google_compute_vpn_tunnel" "backend_a_tunnel3" {
  name                  = "backend-a-ha-vpn-tunnel3"
  project               = "${var.backend_a_project_id}"
  region                = "us-east1"
  vpn_gateway           = google_compute_ha_vpn_gateway.backend_a_ha_gateway2.id
  peer_gcp_gateway      = google_compute_ha_vpn_gateway.backend_a_ha_gateway1.id
  shared_secret         = local.secret
  router                = google_compute_router.backend_a_router2.id
  vpn_gateway_interface = 0
}

resource "google_compute_vpn_tunnel" "backend_a_tunnel4" {
  name                  = "backend-a-ha-vpn-tunnel4"
  project               = "${var.backend_a_project_id}"
  region                = "us-east1"
  vpn_gateway           = google_compute_ha_vpn_gateway.backend_a_ha_gateway2.id
  peer_gcp_gateway      = google_compute_ha_vpn_gateway.backend_a_ha_gateway1.id
  shared_secret         = local.secret
  router                = google_compute_router.backend_a_router2.id
  vpn_gateway_interface = 1
}

resource "google_compute_router_interface" "backend_a_router1_interface1" {
  project    = "${var.project_id}"
  name       = "backend-a-router1-interface1"
  router     = google_compute_router.backend_a_router1.name
  region     = "us-east1"
  ip_range   = "169.254.0.1/30" #????
  vpn_tunnel = google_compute_vpn_tunnel.backend_a_tunnel1.name
}

resource "google_compute_router_peer" "backend_a_router1_peer1" {
  project                   = "${var.project_id}"
  name                      = "backend-a-router1-peer1"
  router                    = google_compute_router.backend_a_router1.name
  region                    = "us-east1"
  peer_ip_address           = "169.254.0.2" #???
  peer_asn                  = 64515
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.backend_a_router1_interface1.name
}

resource "google_compute_router_interface" "backend_a_router1_interface2" {
  project    = "${var.project_id}"
  name       = "backend-a-router1-interface2"
  router     = google_compute_router.backend_a_router1.name
  region     = "us-east1"
  ip_range   = "169.254.1.2/30"
  vpn_tunnel = google_compute_vpn_tunnel.backend_a_tunnel2.name
}

resource "google_compute_router_peer" "backend_a_router1_peer2" {
  project                   = "${var.project_id}"
  name                      = "backend-a-router1-peer2"
  router                    = google_compute_router.backend_a_router1.name
  region                    = "us-east1"
  peer_ip_address           = "169.254.1.1" #???
  peer_asn                  = 64515
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.backend_a_router1_interface2.name
}

resource "google_compute_router_interface" "backend_a_router2_interface1" {
  project    = "${var.backend_a_project_id}"
  name       = "backend-a-router2-interface1"
  router     = google_compute_router.backend_a_router2.name
  region     = "us-east1"
  ip_range   = "169.254.0.2/30" #???
  vpn_tunnel = google_compute_vpn_tunnel.backend_a_tunnel3.name
}

resource "google_compute_router_peer" "backend_a_router2_peer1" {
  project                   = "${var.backend_a_project_id}"
  name                      = "backend-a-router2-peer1"
  router                    = google_compute_router.backend_a_router2.name
  region                    = "us-east1"
  peer_ip_address           = "169.254.0.1"
  peer_asn                  = 64514
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.backend_a_router2_interface1.name
}

resource "google_compute_router_interface" "backend_a_router2_interface2" {
  project    = "${var.backend_a_project_id}"
  name       = "backend-a-router2-interface2"
  router     = google_compute_router.backend_a_router2.name
  region     = "us-east1"
  ip_range   = "169.254.1.1/30"
  vpn_tunnel = google_compute_vpn_tunnel.backend_a_tunnel4.name
}

resource "google_compute_router_peer" "backend_a_route2_peer2" {
  project                   = "${var.backend_a_project_id}"
  name                      = "backend-a-router2-peer2"
  router                    = google_compute_router.backend_a_router2.name
  region                    = "us-east1"
  peer_ip_address           = "169.254.1.2"
  peer_asn                  = 64514
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.backend_a_router2_interface2.name
}


resource "random_id" "secret" {
  byte_length = 8
}


















































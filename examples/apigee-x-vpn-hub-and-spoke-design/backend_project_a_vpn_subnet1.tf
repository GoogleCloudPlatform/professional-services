##########################################################
# Copyright 2021 Google LLC.
# This software is provided as-is, without warranty or
# representation for any use or purpose.
# Your use of it is subject to your agreement with Google.
#
# Sample Terraform script to set up an Apigee X instance 
##########################################################

##########################################################
### Create a Google Cloud Project for Backend a, VPC and subnets
##########################################################
resource "google_compute_ha_vpn_gateway" "backend_project_a_ha_gateway1" {
  region  = "${var.subnet_1}"
  name    = "backend-project-a-ha-vpn-1"
  network = google_compute_network.backend_project_a_vpc.id
  project = google_project.backend_project_a.project_id
}


resource "google_compute_router" "backend_project_a_router1" {
  name    = "backend-project-a-ha-vpn-router1"
  network = google_compute_network.backend_project_a_vpc.name
  project = google_project.backend_project_a.project_id
  region  = "${var.subnet_1}"
  bgp {
    asn = 64515
  }
}

resource "google_compute_vpn_tunnel" "backend_project_a_tunnel1" {
  name                  = "backend-project-a-ha-vpn-tunnel1"
  project               = google_project.apigee_x_project.project_id
  region                = "${var.subnet_1}"
  vpn_gateway           = google_compute_ha_vpn_gateway.apigee_x_project_ha_gateway1.id
  peer_gcp_gateway      = google_compute_ha_vpn_gateway.backend_project_a_ha_gateway1.id
  shared_secret         = local.secret
  router                = google_compute_router.apigee_x_project_router1.id
  vpn_gateway_interface = 0
}

resource "google_compute_vpn_tunnel" "backend_project_a_tunnel2" {
  name                  = "backend-project-a-ha-vpn-tunnel2"
  project               = google_project.apigee_x_project.project_id
  region                = "${var.subnet_1}"
  vpn_gateway           = google_compute_ha_vpn_gateway.backend_project_a_ha_gateway1.id
  peer_gcp_gateway      = google_compute_ha_vpn_gateway.apigee_x_project_ha_gateway1.id
  shared_secret         = local.secret
  router                = google_compute_router.apigee_x_project_router1.id
  vpn_gateway_interface = 1
}

resource "google_compute_vpn_tunnel" "backend_project_a_tunnel3" {
  name                  = "backend-project-a-ha-vpn-tunnel3"
  project               = google_project.backend_project_a.project_id
  region                = "${var.subnet_1}"
  vpn_gateway           = google_compute_ha_vpn_gateway.backend_project_a_ha_gateway1.id
  peer_gcp_gateway      = google_compute_ha_vpn_gateway.apigee_x_project_ha_gateway1.id
  shared_secret         = local.secret
  router                = google_compute_router.backend_project_a_router1.id
  vpn_gateway_interface = 0
}

resource "google_compute_vpn_tunnel" "backend_project_a_tunnel4" {
  name                  = "backend-project-a-ha-vpn-tunnel4"
  project               = google_project.backend_project_a.project_id
  region                = "${var.subnet_1}"
  vpn_gateway           = google_compute_ha_vpn_gateway.apigee_x_project_ha_gateway1.id
  peer_gcp_gateway      = google_compute_ha_vpn_gateway.backend_project_a_ha_gateway1.id
  shared_secret         = local.secret
  router                = google_compute_router.backend_project_a_router1.id
  vpn_gateway_interface = 1
}

resource "google_compute_router_interface" "apigee_x_project_router1_interface1" {
  project    = google_project.apigee_x_project.project_id
  name       = "apigee-x-project-router1-interface1"
  router     = google_compute_router.apigee_x_project_router1.name
  region     = "${var.subnet_1}"
  ip_range   = "169.254.0.1/30" 
  vpn_tunnel = google_compute_vpn_tunnel.backend_project_a_tunnel1.name
}

resource "google_compute_router_peer" "apigee_x_project_router1_peer1" {
  project                   = google_project.apigee_x_project.project_id
  name                      = "apigee-x-project-router1-peer1"
  router                    = google_compute_router.apigee_x_project_router1.name
  region                    = "${var.subnet_1}"
  peer_ip_address           = "169.254.0.2" 
  peer_asn                  = 64515
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.apigee_x_project_router1_interface1.name
}

resource "google_compute_router_interface" "apigee_x_project_router1_interface2" {
  project    = google_project.apigee_x_project.project_id
  name       = "apigee-x-project-router1-interface2"
  router     = google_compute_router.backend_project_a_router1.name
  region     = "${var.subnet_1}"
  ip_range   = "169.254.1.2/30"
  vpn_tunnel = google_compute_vpn_tunnel.backend_project_a_tunnel2.name
}

resource "google_compute_router_peer" "apigee_x_project_router1_peer2" {
  project                   = google_project.apigee_x_project.project_id
  name                      = "backend-a-router1-peer2"
  router                    = google_compute_router.apigee_x_project_router1.name
  region                    = "${var.subnet_1}"
  peer_ip_address           = "169.254.1.1" 
  peer_asn                  = 64515
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.apigee_x_project_router1_interface2.name
}

resource "google_compute_router_interface" "backend_project_a_router1_interface1" {
  project    = google_project.backend_project_a.project_id
  name       = "backend-project-a-router1-interface1"
  router     = google_compute_router.backend_project_a_router1.name
  region     = "${var.subnet_1}"
  ip_range   = "169.254.0.2/30" 
  vpn_tunnel = google_compute_vpn_tunnel.backend_project_a_tunnel3.name
}

resource "google_compute_router_peer" "backend_project_a_router1_peer1" {
  project                   = google_project.backend_project_a.project_id
  name                      = "backend-project-a-router1-peer1"
  router                    = google_compute_router.backend_project_a_router1.name
  region                    = "${var.subnet_1}"
  peer_ip_address           = "169.254.0.1"
  peer_asn                  = 64514
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.backend_project_a_router1_interface1.name
}

resource "google_compute_router_interface" "backend_project_a_router1_interface2" {
  project    = google_project.backend_project_a.project_id
  name       = "backend-a-router1-interface2"
  router     = google_compute_router.backend_project_a_router1.name
  region     = "${var.subnet_1}"
  ip_range   = "169.254.1.1/30"
  vpn_tunnel = google_compute_vpn_tunnel.backend_project_a_tunnel4.name
}

resource "google_compute_router_peer" "backend_project_a_router1_peer2" {
  project                   = google_project.backend_project_a.project_id
  name                      = "backend-project-a-router1-peer2"
  router                    = google_compute_router.backend_project_a_router1.name
  region                    = "${var.subnet_1}"
  peer_ip_address           = "169.254.1.2"
  peer_asn                  = 64514
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.backend_project_a_router1_interface2.name
}




















































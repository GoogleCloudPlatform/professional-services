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
resource "google_compute_ha_vpn_gateway" "backend_project_a_ha_gateway2" {
  region  = "${var.subnet_2}"
  name    = "backend-project-a-ha-vpn-2"
  network = google_compute_network.backend_project_a_vpc.id
  project = google_project.backend_project_a.project_id
}


resource "google_compute_router" "backend_project_a_router2" {
  name    = "backend-project-a-ha-vpn-router2"
  network = google_compute_network.backend_project_a_vpc.name
  project = google_project.backend_project_a.project_id
  region  = "${var.subnet_2}"
  bgp {
    asn = "${var.backend_project_a_router2_asn}"
  }
}

resource "google_compute_vpn_tunnel" "backend_project_a_tunnel5" {
  name                  = "backend-project-a-ha-vpn-tunnel5"
  project               = google_project.apigee_x_project.project_id
  region                = "${var.subnet_2}"
  vpn_gateway           = google_compute_ha_vpn_gateway.apigee_x_project_ha_gateway2.id
  peer_gcp_gateway      = google_compute_ha_vpn_gateway.backend_project_a_ha_gateway2.id
  shared_secret         = local.secret
  router                = google_compute_router.apigee_x_project_router2.id
  vpn_gateway_interface = 0
}

resource "google_compute_vpn_tunnel" "backend_project_a_tunnel6" {
  name                  = "backend-project-a-ha-vpn-tunnel6"
  project               = google_project.apigee_x_project.project_id
  region                = "${var.subnet_2}"
  vpn_gateway           = google_compute_ha_vpn_gateway.backend_project_a_ha_gateway2.id
  peer_gcp_gateway      = google_compute_ha_vpn_gateway.apigee_x_project_ha_gateway2.id
  shared_secret         = local.secret
  router                = google_compute_router.apigee_x_project_router2.id
  vpn_gateway_interface = 1
}

resource "google_compute_vpn_tunnel" "backend_project_a_tunnel7" {
  name                  = "backend-project-a-ha-vpn-tunnel7"
  project               = google_project.backend_project_a.project_id
  region                = "${var.subnet_2}"
  vpn_gateway           = google_compute_ha_vpn_gateway.backend_project_a_ha_gateway2.id
  peer_gcp_gateway      = google_compute_ha_vpn_gateway.apigee_x_project_ha_gateway2.id
  shared_secret         = local.secret
  router                = google_compute_router.backend_project_a_router2.id
  vpn_gateway_interface = 0
}

resource "google_compute_vpn_tunnel" "backend_project_a_tunnel8" {
  name                  = "backend-project-a-ha-vpn-tunnel8"
  project               = google_project.backend_project_a.project_id
  region                = "${var.subnet_2}"
  vpn_gateway           = google_compute_ha_vpn_gateway.apigee_x_project_ha_gateway2.id
  peer_gcp_gateway      = google_compute_ha_vpn_gateway.backend_project_a_ha_gateway2.id
  shared_secret         = local.secret
  router                = google_compute_router.backend_project_a_router2.id
  vpn_gateway_interface = 1
}

resource "google_compute_router_interface" "apigee_x_project_router2_interface1" {
  project    = google_project.apigee_x_project.project_id
  name       = "apigee-x-project-router2-interface1"
  router     = google_compute_router.apigee_x_project_router2.name
  region     = "${var.subnet_2}"
  ip_range   = "169.254.0.1/30" 
  vpn_tunnel = google_compute_vpn_tunnel.backend_project_a_tunnel5.name
}

resource "google_compute_router_peer" "apigee_x_project_router2_peer1" {
  project                   = google_project.apigee_x_project.project_id
  name                      = "apigee-x-project-router2-peer1"
  router                    = google_compute_router.apigee_x_project_router2.name
  region                    = "${var.subnet_2}"
  peer_ip_address           = "169.254.0.2" 
  peer_asn                  = "${var.backend_project_a_router2_asn}"
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.apigee_x_project_router2_interface1.name
}

resource "google_compute_router_interface" "apigee_x_project_router2_interface2" {
  project    = google_project.apigee_x_project.project_id
  name       = "apigee-x-project-router2-interface2"
  router     = google_compute_router.backend_project_a_router2.name
  region     = "${var.subnet_2}"
  ip_range   = "169.254.1.2/30"
  vpn_tunnel = google_compute_vpn_tunnel.backend_project_a_tunnel6.name
}

resource "google_compute_router_peer" "apigee_x_project_router2_peer2" {
  project                   = google_project.apigee_x_project.project_id
  name                      = "backend-a-router2-peer2"
  router                    = google_compute_router.apigee_x_project_router2.name
  region                    = "${var.subnet_2}"
  peer_ip_address           = "169.254.1.1" 
  peer_asn                  = "${var.backend_project_a_router2_asn}"
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.apigee_x_project_router2_interface2.name
}

resource "google_compute_router_interface" "backend_project_a_router2_interface1" {
  project    = google_project.backend_project_a.project_id
  name       = "backend-project-a-router2-interface1"
  router     = google_compute_router.backend_project_a_router2.name
  region     = "${var.subnet_2}"
  ip_range   = "169.254.0.2/30" 
  vpn_tunnel = google_compute_vpn_tunnel.backend_project_a_tunnel7.name
}

resource "google_compute_router_peer" "backend_project_a_router2_peer1" {
  project                   = google_project.backend_project_a.project_id
  name                      = "backend-project-a-router2-peer1"
  router                    = google_compute_router.backend_project_a_router2.name
  region                    = "${var.subnet_2}"
  peer_ip_address           = "169.254.0.1"
  peer_asn                  = "${var.apigee_x_project_router2_asn}"
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.backend_project_a_router2_interface1.name
}

resource "google_compute_router_interface" "backend_project_a_router2_interface2" {
  project    = google_project.backend_project_a.project_id
  name       = "backend-a-router2-interface2"
  router     = google_compute_router.backend_project_a_router2.name
  region     = "${var.subnet_2}"
  ip_range   = "169.254.1.1/30"
  vpn_tunnel = google_compute_vpn_tunnel.backend_project_a_tunnel8.name
}

resource "google_compute_router_peer" "backend_project_a_router2_peer2" {
  project                   = google_project.backend_project_a.project_id
  name                      = "backend-project-a-router2-peer2"
  router                    = google_compute_router.backend_project_a_router2.name
  region                    = "${var.subnet_2}"
  peer_ip_address           = "169.254.1.2"
  peer_asn                  = "${var.apigee_x_project_router2_asn}"
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.backend_project_a_router2_interface2.name
}




















































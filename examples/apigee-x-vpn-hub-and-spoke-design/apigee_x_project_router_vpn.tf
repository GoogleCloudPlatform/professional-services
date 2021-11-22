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
resource "google_compute_ha_vpn_gateway" "apigee_x_project_ha_gateway1" {
  region  = "${var.subnet_1}"
  name    = "apigee-x-project-ha-vpn1"
  network = google_compute_network.apigee_x_vpc.id
  project = google_project.apigee_x_project.project_id
}

resource "google_compute_ha_vpn_gateway" "apigee_x_project_ha_gateway2" {
  region  = "${var.subnet_2}"
  name    = "apigee-x-project-ha-vpn2"
  network = google_compute_network.apigee_x_vpc.id
  project = google_project.apigee_x_project.project_id
}

resource "google_compute_router" "apigee_x_project_router1" {
  name    = "apigee-x-project-ha-vpn-router1"
  network = google_compute_network.apigee_x_vpc.name
  project = google_project.apigee_x_project.project_id
  region  = "${var.subnet_1}"
  bgp {
    asn = "${var.apigee_x_project_router1_asn}"
  }
}

resource "google_compute_router" "apigee_x_project_router2" {
  name    = "apigee-x-project-ha-vpn-router2"
  network = google_compute_network.apigee_x_vpc.name
  project = google_project.apigee_x_project.project_id
  region  = "${var.subnet_2}"
  bgp {
    asn = "${var.apigee_x_project_router2_asn}"
  }
}
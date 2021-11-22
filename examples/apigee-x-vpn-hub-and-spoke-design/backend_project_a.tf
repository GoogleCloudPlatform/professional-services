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
resource "google_project" "backend_project_a" {
  provider            = google
  project_id          = "backend-project-a-${lower(random_id.random_suffix.hex)}"
  name                = "backend-project-a-${lower(random_id.random_suffix.hex)}"
  org_id              = "${var.gcp_org_id}"
  billing_account     = "${var.gcp_billing_id}"
  auto_create_network = false
}

resource "google_project_service" "backend_project_a_compute" {
  provider = google
  project  = google_project.backend_project_a.project_id
  service  = "compute.googleapis.com"
}


resource "google_project_service" "backend_project_a_dns_peering" {
  provider = google
  project  = google_project.backend_project_a.project_id
  service  = "dns.googleapis.com"
}

resource "google_compute_network" "backend_project_a_vpc" {
  provider                        = google
  name                            = "backend-project-a-vpc"
  project                         = google_project.backend_project_a.project_id 
  auto_create_subnetworks         = false
  routing_mode                    = "REGIONAL"
  description                     = "Backend projects a for acting as one of the Apigee environments"
}

resource "google_compute_subnetwork" "backend_project_a_subnet1" {
  project                  = google_project.backend_project_a.project_id
  name                     = "${var.subnet_1}-subnet"
  region                   = "${var.subnet_1}"
  network                  = google_compute_network.backend_project_a_vpc.id
  ip_cidr_range            = "192.168.1.0/24"
}

resource "google_compute_subnetwork" "backend_project_a_subnet2" {
  project                  = google_project.backend_project_a.project_id
  name                     = "${var.subnet_2}-subnet"
  region                   = "${var.subnet_2}"
  network                  = google_compute_network.backend_project_a_vpc.id
  ip_cidr_range            = "192.168.2.0/24"
}

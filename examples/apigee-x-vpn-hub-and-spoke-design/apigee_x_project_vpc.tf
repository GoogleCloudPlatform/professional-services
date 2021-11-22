##########################################################
# Copyright 2021 Google LLC.
# This software is provided as-is, without warranty or
# representation for any use or purpose.
# Your use of it is subject to your agreement with Google.
#
# Sample Terraform script to set up an Apigee X instance 
##########################################################

#######################################################################
### Create a Google Cloud VPC, subnet, Apigee Org for Apigee X project
#######################################################################
resource "google_compute_network" "apigee_x_vpc" {
  provider                        = google
  name                            = "apigee-x-vpc"
  auto_create_subnetworks         = false
  routing_mode                    = "REGIONAL"
  project                         = google_project.apigee_x_project.project_id
  description                     = "Apigee X VPC for Apigee Org"
  depends_on                      = [google_project_service.compute]
}

resource "google_compute_subnetwork" "apigee_x_subnetwork" {
  project                  = google_project.apigee_x_project.project_id
  name                     = "apigee-x-subnetwork"
  region                   = "${var.apigee_x_project_subnet}"
  network                  = google_compute_network.apigee_x_vpc.id
  ip_cidr_range            = "10.2.0.0/20"
  private_ip_google_access = true
  depends_on               = [google_project_service.compute, 
                             google_compute_network.apigee_x_vpc]
}

resource "google_compute_global_address" "apigee_x_range" {
  project       = google_project.apigee_x_project.project_id
  name          = "apigee-x-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16 #23?
  network       = google_compute_network.apigee_x_vpc.id
}

resource "google_service_networking_connection" "apigee_x_vpc_connection" {
  provider                = google
  network                 = google_compute_network.apigee_x_vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.apigee_x_range.name]
  depends_on              = [google_project_service.servicenetworking]
}

######Reserve external IP address
resource "google_compute_global_address" "external_ip" {
  project      = google_project.apigee_x_project.project_id
  name         = "global-external-ip"
  address_type = "EXTERNAL"
}


resource "google_kms_key_ring" "apigee_x_keyring" {
  project    = google_project.apigee_x_project.project_id
  name       = "apigee-x-keyring"
  location   = "us-central1"

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_kms_crypto_key" "apigee_x_key" {
  provider = google
  name     = "apigee-x-key"
  key_ring = google_kms_key_ring.apigee_x_keyring.id

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_project_service_identity" "apigee_x_sa" {
  provider = google-beta
  project  = google_project.apigee_x_project.project_id
  service  = google_project_service.apigee.service
}


resource "google_kms_crypto_key_iam_binding" "apigee_x_sa_keyuser" {
  provider      = google
  crypto_key_id = google_kms_crypto_key.apigee_x_key.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"

  members = [
    "serviceAccount:${google_project_service_identity.apigee_x_sa.email}",
  ]
}

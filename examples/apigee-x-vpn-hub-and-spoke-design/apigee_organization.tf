resource "google_compute_network" "apigee_network" {
  provider                        = google
  name                            = "apigee-x-vpc"
  auto_create_subnetworks         = false
  routing_mode                    = "REGIONAL"
  project                         = "${var.project_id}"
  description                     = "Apigee X VPC for Apigee Org"
  depends_on                      = [google_project_service.compute]
}

###########Create subnet
resource "google_compute_subnetwork" "apigee_subnetwork" {
  project                  = "${var.project_id}"
  name                     = "apigee-x-subnetwork"
  region                   = "us-central1"
  network                  = google_compute_network.apigee_network.id
  ip_cidr_range            = "10.2.0.0/20"
  private_ip_google_access = true
  depends_on               = [google_project_service.compute, 
                             google_compute_network.apigee_network]
}
###################

resource "google_compute_global_address" "apigee_range" {
  project       = "${var.project_id}"
  name          = "apigee-x-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16 #23?
  network       = google_compute_network.apigee_network.id
}

resource "google_service_networking_connection" "apigee_vpc_connection" {
  provider                = google
  network                 = google_compute_network.apigee_network.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.apigee_range.name]
  depends_on              = [google_project_service.servicenetworking]
}

######Reserve external IP address
resource "google_compute_global_address" "external_ip" {
  project      = "${var.project_id}"
  name         = "global-external-ip"
  address_type = "EXTERNAL"
}

locals {
  apigee_hostname = "${replace(google_compute_global_address.external_ip.address, ".", "-")}.nip.io"
}
############

resource "google_kms_key_ring" "apigee_keyring" {
  project    = "${var.project_id}"
  name       = "apigee-x-keyring"
  location   = "us-central1"

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_kms_crypto_key" "apigee_key" {
  provider = google
  name     = "apigee-key"
  key_ring = google_kms_key_ring.apigee_keyring.id

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_project_service_identity" "apigee_sa" {
  provider = google-beta
  project  = "${var.project_id}"
  service  = google_project_service.apigee.service
}


resource "google_kms_crypto_key_iam_binding" "apigee_sa_keyuser" {
  provider      = google
  crypto_key_id = google_kms_crypto_key.apigee_key.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"

  members = [
    "serviceAccount:${google_project_service_identity.apigee_sa.email}",
  ]
}

resource "google_apigee_organization" "org" {
  analytics_region                     = "us-central1"
  display_name                         = "apigee-x-project"
  description                          = "Terraform-provisioned Apigee X Org."
  project_id                           = "${var.project_id}"
  authorized_network                   = google_compute_network.apigee_network.id
  runtime_database_encryption_key_name = google_kms_crypto_key.apigee_key.id

  depends_on = [
    google_service_networking_connection.apigee_vpc_connection,
    google_kms_crypto_key_iam_binding.apigee_sa_keyuser,
  ]
}


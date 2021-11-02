# data "google_client_config" "current" {}

# resource "google_compute_network" "apigee_network" {
#   project = "${var.project_id}"
#   name    = "apigee-x-vpc"
#   # auto_create_subnetworks = false
# }

# resource "google_compute_subnetwork" "apigee_network-us-east1-subnet" {
#   name          = "us-east1-subnet"
#   ip_cidr_range = "10.2.0.0/16"
#   region        = "us-east1"
#   network       = google_compute_network.apigee_network.id
# }

# resource "google_compute_subnetwork" "apigee_network-us-west2-subnet" {
#   name          = "us-west2-subnet"
#   ip_cidr_range = "10.2.0.0/16"
#   region        = "us-west2"
#   network       = google_compute_network.apigee_network.id
# }


# resource "google_compute_global_address" "apigee_range" {
#   name          = "apigee-range"
#   purpose       = "VPC_PEERING"
#   address_type  = "INTERNAL"
#   prefix_length = 16
#   network       = google_compute_network.apigee_network.id
# }

# resource "google_service_networking_connection" "apigee_vpc_connection" {
#   network                 = google_compute_network.apigee_network.id
#   service                 = "servicenetworking.googleapis.com"
#   reserved_peering_ranges = [google_compute_global_address.apigee_range.name]
# }

# resource "google_kms_key_ring" "apigee_keyring" {
#   project  = "${var.project_id}"
#   name     = "apigee-keyring"
#   location = "us-central1"
# }

# resource "google_kms_crypto_key" "apigee_key" {
#   name     = "apigee-key"
#   key_ring = google_kms_key_ring.apigee_keyring.id

#   lifecycle {
#     prevent_destroy = true
#   }
# }

resource "google_project_service_identity" "apigee_sa" {
  provider = google-beta
  project  = "${var.project_id}"
  service  = google_project_service.apigee.service
}

resource "google_project_service_identity" "apigee_x_sa" {
  provider = google-beta
  project  = "apigee-x-hw"
  service  = google_project_service.apigee.service
}

# resource "google_kms_crypto_key_iam_binding" "apigee_sa_keyuser" {
#   crypto_key_id = google_kms_crypto_key.apigee_key.id
#   role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"

#   members = [
#     "serviceAccount:${google_project_service_identity.apigee_sa.email}",
#   ]
# }

resource "google_apigee_organization" "org" {
  analytics_region                     = "us-central1"
  display_name                         = "apigee-x-org"
  description                          = "Terraform-provisioned Apigee X Org."
  project_id                           = "apigee-x-hw"
  authorized_network                   = "projects/instant-form-328123/global/networks/apigee-network"
}

# resource "google_compute_instance_group" "apigee_backend_a" {
#   name        = "apigee_backend_a"
#   description = "Apigee instance group a"
#   zone        = "us-central1-a"
#   network     = google_compute_network.apigee_network.id
# }


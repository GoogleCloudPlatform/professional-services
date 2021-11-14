
# ##### Create a porject and enabled all necessary APIs services


# resource "random_id" "random_suffix" {
#   byte_length = 6
# }

# resource "google_project" "project" {
#   provider            = google
#   project_id          = "apigee-tf-demo-${lower(random_id.random_suffix.hex)}"
#   name                = "apigee-tf-demo-${lower(random_id.random_suffix.hex)}"
#   org_id              = var.gcp-org-id
#   billing_account     = var.gcp-billing-id
#   auto_create_network = false
# }
data "google_client_config" "current" {}


resource "google_project_service" "compute" {
  provider = google
  project  = "${var.project_id}"
  service  = "compute.googleapis.com"
}

resource "google_project_service" "apigee" {
  provider = google
  project  = "${var.project_id}"
  service  = "apigee.googleapis.com"

  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "servicenetworking" {
  provider = google
  project  = "${var.project_id}"
  service  = "servicenetworking.googleapis.com"
}

resource "google_project_service" "kms" {
  provider = google
  project  = "${var.project_id}"
  service  = "cloudkms.googleapis.com"
}

resource "google_project_service" "dns" {
  provider = google
  project  = "${var.project_id}"
  service  = "dns.googleapis.com"
}


resource "google_project_service" "dns_peering_a" {
  provider = google
  project  = "${var.backend_a_project_id}"
  service  = "dns.googleapis.com"
}

##########################################################
# Copyright 2021 Google LLC.
# This software is provided as-is, without warranty or
# representation for any use or purpose.
# Your use of it is subject to your agreement with Google.
#
# Sample Terraform script to set up an Apigee X instance 
##########################################################

##########################################################
### Create a Google Cloud Project for Apigee X runtime
##########################################################

resource "google_project" "apigee_x_project" {
  provider            = google
  project_id          = "apigee-x-project-${lower(random_id.random_suffix.hex)}"
  name                = "apigee-x-project-${lower(random_id.random_suffix.hex)}"
  org_id              = "${var.gcp_org_id}"
  billing_account     = "${var.gcp_billing_id}"
  auto_create_network = false
}

resource "google_project_service" "compute" {
  provider = google
  project  = google_project.apigee_x_project.project_id
  service  = "compute.googleapis.com"
}

resource "google_project_service" "apigee" {
  provider = google
  project  = google_project.apigee_x_project.project_id
  service  = "apigee.googleapis.com"

  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "servicenetworking" {
  provider = google
  project  = google_project.apigee_x_project.project_id
  service  = "servicenetworking.googleapis.com"
}

resource "google_project_service" "kms" {
  provider = google
  project  = google_project.apigee_x_project.project_id
  service  = "cloudkms.googleapis.com"
}

resource "google_project_service" "dns" {
  provider = google
  project  = google_project.apigee_x_project.project_id
  service  = "dns.googleapis.com"
}
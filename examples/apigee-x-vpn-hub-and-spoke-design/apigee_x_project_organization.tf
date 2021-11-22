##########################################################
# Copyright 2021 Google LLC.
# This software is provided as-is, without warranty or
# representation for any use or purpose.
# Your use of it is subject to your agreement with Google.
#
# Sample Terraform script to set up an Apigee X instance 
##########################################################

#######################################################################
### Create an Apigee instance, environment and environment group
#######################################################################
resource "google_apigee_organization" "apigee_x_org" {
  analytics_region                     = "${var.apigee_x_project_subnet}"
  display_name                         = "apigee-x-project"
  description                          = "Terraform-provisioned Apigee X Org."
  project_id                           = google_project.apigee_x_project.project_id
  authorized_network                   = google_compute_network.apigee_x_vpc.id
  runtime_database_encryption_key_name = google_kms_crypto_key.apigee_x_key.id

  depends_on = [
    google_service_networking_connection.apigee_x_vpc_connection,
    google_kms_crypto_key_iam_binding.apigee_x_sa_keyuser,
  ]
}

resource "google_apigee_instance" "apigee_x_instance" {
  name                     = "apigee-x-inst-${lower(random_id.random_suffix.hex)}"
  location                 = "${var.apigee_x_project_subnet}"
  description              = "Terraform-provisioned Apigee Runtime Instance"
  org_id                   = google_apigee_organization.apigee_x_org.id
  disk_encryption_key_name = google_kms_crypto_key.apigee_x_key.id
  peering_cidr_range       = "SLASH_${var.cidr_mask}"
}

resource "google_apigee_environment" "apigee_x_env" {
  org_id = google_apigee_organization.apigee_x_org.id
  name   = "apigee-x-project-dev-env"
}

resource "google_apigee_instance_attachment" "env_to_instance_attachment" {
  instance_id = google_apigee_instance.apigee_x_instance.id 
  environment = google_apigee_environment.apigee_x_env.name
}

resource "google_apigee_envgroup" "apigee_x_envgroup" {
  org_id   = google_apigee_organization.apigee_x_org.id
  name     = "apigee-x-project-dev-envgroup"
  hostnames = [local.apigee_x_hostname]
}

resource "google_apigee_envgroup_attachment" "env_to_envgroup_attachment" {
  envgroup_id = google_apigee_envgroup.apigee_x_envgroup.id
  environment = google_apigee_environment.apigee_x_env.name
}


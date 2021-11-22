##########################################################
# Copyright 2021 Google LLC.
# This software is provided as-is, without warranty or
# representation for any use or purpose.
# Your use of it is subject to your agreement with Google.
#
# Sample Terraform script to set up an Apigee X instance 
##########################################################

##########################################################
### Create a Google Cloud Project for the demo
##########################################################
data "google_client_config" "current" {}


resource "random_id" "random_suffix" {
  byte_length = 6
}

resource "random_id" "secret" {
  byte_length = 8
}

locals {
  apigee_x_hostname = "${replace(google_compute_global_address.external_ip.address, ".", "-")}.nip.io"
  secret = random_id.secret.b64_url


}




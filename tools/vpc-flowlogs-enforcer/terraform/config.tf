/*
 * Copyright 2021 Google LLC. This software is provided as-is, without warranty
 * or representation for any use or purpose. Your use of it is subject to your 
 * agreement with Google.  
 */

terraform {
  required_providers {
    google = {
      version = "~> 3.54"
    }
  }

  # backend "gcs" {
  #   bucket = "MY_GCS_BUCKET"
  #   prefix = "TF_STATE_PREFIX/services"
  # }
}

provider "google" {
  alias = "impersonate"
}

provider "google" {
  access_token = data.google_service_account_access_token.default.access_token
}

data "google_service_account_access_token" "default" {
  provider               = google.impersonate
  target_service_account = var.terraform_service_account
  scopes                 = ["userinfo-email", "cloud-platform"]
  lifetime               = "600s"
}
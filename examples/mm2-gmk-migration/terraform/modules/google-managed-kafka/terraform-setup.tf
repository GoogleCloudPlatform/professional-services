# Declare the connection to the google provider with Terraform required version
terraform {
  required_providers {
    google = {
      version = "~> 6.0.0"
    }
  }
  required_version = "~> 1.5.7"
}


provider "google-beta" {
  project = var.project_id
  region  = var.region
}

provider "google" {
  project = var.project_id
  region  = var.region
}
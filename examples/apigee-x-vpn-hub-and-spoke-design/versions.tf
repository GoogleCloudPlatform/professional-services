terraform {
  required_version = ">= 0.13"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.0.0"
    }
    # google-beta = {
    #   source  = "hashicorp/google"
    #   version = "3.87.0"
    # }
  }
}

provider "google" {
  
}
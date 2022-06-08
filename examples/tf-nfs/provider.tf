terraform {
  required_version = "~> 1.1.6"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 3.79.0"
    }
    google-beta = {
      source = "hashicorp/google-beta"
    }
    netapp-gcp = {
      source  = "NetApp/netapp-gcp"
      version = "22.1.0"
    }
  }

  backend "gcs" {
    bucket = "tf-state-samp123"
    prefix = "nfs"
  }
}

provider "google" {
  project = var.project_id
  region  = "us-west2"
}

provider "google-beta" {
  project = var.project_id
  region  = "us-west2"
}

provider "netapp-gcp" {
  project     = 97656261064 # BUG: Provider doesn't handle the project name to number convertion
  credentials = base64decode(google_service_account_key.nfs-key.private_key)
}
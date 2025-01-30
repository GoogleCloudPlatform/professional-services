terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
    }
    kubernetes = {
      source = "hashicorp/kubernetes"
    }
  }
  required_version = ">= 0.13"
}

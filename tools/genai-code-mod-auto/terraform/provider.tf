terraform {
  required_version = ">=0.13"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.0.0"
    }
  }
  provider_meta "google" {
    module_name = "blueprints/terraform/exported-krm/v0.1.0"
  }
}

provider "google" {
  region  = var.gcp_region
  project = var.gcp_project_id
}

provider "aws" {
  region = var.aws_region
}



provider "google" {
  project = var.project_id
  region = var.region
  # Needed since CAI doesn't work with user login
  impersonate_service_account = var.deployment_sa
}
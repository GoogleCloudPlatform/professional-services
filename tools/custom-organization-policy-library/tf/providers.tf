terraform {
  # backend "gcs" {
  #   bucket                      = "xxxxxx"
  #   impersonate_service_account = "xxxxxx@xxxxxxx.iam.gserviceaccount.com"
  # }
  backend "local" {
  }
}
provider "google" {
  impersonate_service_account = "xxxxxx@xxxxxxx.iam.gserviceaccount.com"
}
provider "google-beta" {
  impersonate_service_account = "xxxxxx@xxxxxxx.iam.gserviceaccount.com"
}

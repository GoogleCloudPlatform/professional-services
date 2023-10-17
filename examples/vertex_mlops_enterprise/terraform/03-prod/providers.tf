terraform {
  backend "gcs" {
    bucket = "pcorp-iac-core-bucket"
    prefix = "mlops1"
  }
}

provider "google" {
  impersonate_service_account = "pcorp-iac-core@pcorp-iac-core.iam.gserviceaccount.com"
}
provider "google-beta" {
  impersonate_service_account = "pcorp-iac-core@pcorp-iac-core.iam.gserviceaccount.com"
}

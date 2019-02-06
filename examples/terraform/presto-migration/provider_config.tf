locals {
  service_account_path = "${path.module}/<KEY_FILE_NAME>"
}

provider "google" {
  credentials = "${file(local.service_account_path)}"
  project     = "${var.project}"
  region      = "${var.region}"
}

provider "google-beta" {
  credentials = "${file(local.service_account_path)}"
  project     = "${var.project}"
  region      = "${var.region}"
}

provider "google" {
  region = "${var.gcp_region}"
}

terraform {
  backend "gcs" {}
}

resource "google_pubsub_topic" "example-pubsub" {
  name = "${var.name}"
  project = "${var.project_id}"
  labels = {
    example-tag = "${var.tag}"
  }
}

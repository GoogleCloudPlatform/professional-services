provider "google" {
  project     = "${var.project-name}"
  region      = "${var.region}"
}

// Create a new instance
resource "google_container_cluster" "terraform-builder-local-backend" {
  name               = "terraform-builder-local-backend"
  zone               = "${var.region}"
  initial_node_count = "3"

  node_config {
    disk_size_gb  = "10"
    oauth_scopes = [
      "https://www.googleapis.com/auth/compute",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]

    labels {
      reason = "terraform-builder-example"
    }

    tags = ["example"]
  }
}
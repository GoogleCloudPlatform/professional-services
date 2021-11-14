resource "random_id" "random_suffix" {
  byte_length = 6
}

resource "google_project" "backend_project_a" {
  provider            = google
  project_id          = "backend-project-a-331014"
  name                = "backend-project-a"
  org_id              = "${var.gcp-org-id}"
  billing_account     = "${var.gcp-billing-id}"
  auto_create_network = false
}

resource "google_project_service" "backend_a_compute" {
  provider = google
  project  = google_project.backend_project_a.id
  service  = "compute.googleapis.com"
}

resource "google_compute_network" "backend_project_a_vpc" {
  provider                        = google
  name                            = "backend-project-a-vpc"
  project                         = google_project.backend_project_a.project_id 
  auto_create_subnetworks         = false
  routing_mode                    = "REGIONAL"
  description                     = "Backend projects a for testing transient VPN connectivity"
}

resource "google_compute_subnetwork" "backend_a_subnet-01" {
  project                  = google_project.backend_project_a.project_id
  name                     = "subnet-01"
  region                   = "us-east1"
  network                  = google_compute_network.backend_project_a_vpc.id
  ip_cidr_range            = "192.168.1.0/24"
}

resource "google_compute_subnetwork" "backend_a_subnet-02" {
  project                  = google_project.backend_project_a.project_id
  name                     = "subnet-02"
  region                   = "us-west4"
  network                  = google_compute_network.backend_project_a_vpc.id
  ip_cidr_range            = "192.168.2.0/24"
}

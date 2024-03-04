resource "random_id" "gpu_management_plane" {
  byte_length = 2
}

resource "google_compute_network" "gpu_management_plane" {
  project                 = var.project_id
  name                    = "gpu-management-plane-${random_id.gpu_management_plane.hex}"
  auto_create_subnetworks = false
  mtu                     = 8244
}

resource "google_compute_subnetwork" "gpu_management_plane" {
  project       = var.project_id
  name          = "gpu-management-plane-${random_id.gpu_management_plane.hex}"
  region        = var.region
  network       = google_compute_network.gpu_management_plane.id
  ip_cidr_range = "192.168.0.0/24"
}

resource "google_compute_firewall" "gpu_management_plane-allow-all" {
  name      = "gpu-management-firewall-allow-all"
  project   = var.project_id
  network   = google_compute_network.gpu_management_plane.name
  direction = "INGRESS"


  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  source_ranges = ["192.168.0.0/16"]
}

resource "google_compute_firewall" "gpu_management_plane-allow-icmp" {
  name      = "gpu-management-firewall-allow-icmp"
  project   = var.project_id
  network   = google_compute_network.gpu_management_plane.name
  direction = "INGRESS"

  allow {
    protocol = "icmp"
  }

  source_ranges = ["0.0.0.0/0"]
}
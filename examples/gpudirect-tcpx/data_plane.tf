resource "random_id" "gpu_data_plane" {
  byte_length = 2
}

locals {
  data_planes = {
    "one" : "192.168.1.0/24",
    "two" : "192.168.2.0/24",
    "three" : "192.168.3.0/24",
    "four" : "192.168.4.0/24"
  }
}

resource "google_compute_network" "gpu_data_plane" {
  for_each                = local.data_planes
  project                 = var.project_id
  name                    = "gpu-data-plane-${each.key}-${random_id.gpu_data_plane.hex}"
  auto_create_subnetworks = false
  mtu                     = 8244
}

resource "google_compute_subnetwork" "gpu_data_plane" {
  for_each      = local.data_planes
  project       = var.project_id
  name          = "gpu-data-plane-${each.key}-${random_id.gpu_data_plane.hex}"
  region        = var.region
  network       = google_compute_network.gpu_data_plane[each.key].id
  ip_cidr_range = each.value
}

resource "google_compute_firewall" "gpu_data_plane" {
  for_each  = local.data_planes
  name      = "gpu-dataplane-firewall-${each.key}"
  project   = var.project_id
  network   = google_compute_network.gpu_data_plane[each.key].name
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
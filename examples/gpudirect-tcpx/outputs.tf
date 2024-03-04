locals {
  networks = {
    management = google_compute_network.gpu_management_plane
    data_plane = google_compute_network.gpu_data_plane
  }
  subnetworks = {
    management = google_compute_subnetwork.gpu_management_plane
    data_plane = google_compute_subnetwork.gpu_data_plane
  }
  firewall_rules = {
    management = [google_compute_firewall.gpu_management_plane-allow-all, google_compute_firewall.gpu_management_plane-allow-icmp]
    data_plane = [google_compute_firewall.gpu_data_plane]
  }
}

output "networks" {
  value = local.networks
}

output "subnetworks" {
  value = local.subnetworks
}

output "firewall_rules" {
  value = local.firewall_rules
}
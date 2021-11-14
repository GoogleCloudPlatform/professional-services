resource "google_dns_managed_zone" "private_zone" {
  project     = "${var.project_id}"
  name        = "private-zone"
  dns_name    = "${var.private_zone_domain}"
  description = "Private DNS zone for Apigee requests"
  visibility  = "private"
  
  private_visibility_config {
    networks {
      network_url = google_compute_network.apigee_network.id
    }
  }
  
  forwarding_config {
    target_name_servers {
      ipv4_address = "${var.forwarding_server_1}"
    }
  }
}

resource "google_dns_managed_zone" "peering_zone_backend_a" {
  project     = "${var.backend_a_project_id}"
  name        = "peering-zone-backend-a"
  dns_name    = "${var.peering_zone_domain_a}"
  description = "Peering zone for backend a project"

  visibility = "private"
  private_visibility_config {
    networks {
      network_url = google_compute_network.backend_project_a_vpc.id
    }
  }

  peering_config {
    target_network {
      network_url = google_compute_network.apigee_network.id
    }
  }
}
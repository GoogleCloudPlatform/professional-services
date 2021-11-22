resource "google_dns_managed_zone" "apigee_x_project_forwarding_zone" {
  project     = google_project.apigee_x_project.project_id
  name        = "apigee-x-project-forwarding-zone"
  dns_name    = "${var.private_zone_domain}"
  description = "Private DNS zone for Apigee requests"
  visibility  = "private"
  
  private_visibility_config {
    networks {
      network_url = google_compute_network.apigee_x_vpc.id
    }
  }
  
  forwarding_config {
    target_name_servers {
      ipv4_address = "${var.forwarding_server_1}"
    }
  }
}

resource "google_dns_managed_zone" "backend_project_a_peering_zone" {
  project     = google_project.backend_project_a.project_id
  name        = "backend-project-a-peering-zone"
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
      network_url = google_compute_network.apigee_x_vpc.id
    }
  }
}
/**
resource "google_compute_global_address" "cluster1_ingress" {
  name         = "${var.prefix}-${local.frontend_external_address_name}"
  project      = var.project_id
  description  = "${var.prefix}-cluster1-ingress"
  address_type = "EXTERNAL"
}

output cluster1_ingress {
  value = google_compute_global_address.cluster1_ingress.address
}
*/
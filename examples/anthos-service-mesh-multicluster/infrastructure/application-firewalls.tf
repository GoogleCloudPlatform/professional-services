# Running on cluster4 cluster:
#   "adservice:9555"
#   "cartservice:7070"
#   "currencyservice:7000"
#   "emailservice:5000"
#   "productcatalogservice:3550"
#   "recommendationservice:8080"
#   "shippingservice:50051"
#   "checkoutservice:5050"

resource "google_compute_firewall" "from-cluster3-to-cluster4" {
  name          = "${var.prefix}-from-cluster3-to-cluster4"
  project       = var.project_id
  #network       = google_compute_network.asm-vpc-3.name
  network       = data.google_compute_network.asm-vpc-3.name
  source_ranges = [local.cluster3_pod_ip_cidr_range]
  target_tags   = [local.cluster4_network_tag]
  allow {
    protocol = "tcp"
    ports    = [9555, 7070, 7000, 5000, 3550, 8080, 50051, 5050]
  }
}

resource "google_compute_firewall" "from-cluster4-to-cluster3" {
  name          = "${var.prefix}-from-cluster4-to-cluster3"
  project       = var.project_id
  #network       = google_compute_network.asm-vpc-3.name
  network       = data.google_compute_network.asm-vpc-3.name
  source_ranges = [local.cluster4_pod_ip_cidr_range]
  target_tags   = [local.cluster3_network_tag]
  allow {
    protocol = "tcp"
    ports    = [5000]
  }
}




// Forwarding rule for External Network Load Balancing using Backend Services
# resource "google_compute_forwarding_rule" "default" {
#   provider              = google-beta
#   name                  = "website-forwarding-rule"
#   region                = "us-central1"
#   port_range            = 80
#   backend_service       = google_compute_global_network_endpoint_group.neg.id
# }




# resource "google_compute_region_backend_service" "backend" {
#   provider              = google-beta
#   name                  = "website-backend"
#   region                = "us-central1"
#   load_balancing_scheme = "EXTERNAL"
#   health_checks         = [google_compute_region_health_check.hc.id]
# }
# resource "google_compute_region_health_check" "hc" {
#   provider           = google-beta
#   name               = "check-website-backend"
#   check_interval_sec = 1
#   timeout_sec        = 1
#   region             = "us-central1"

#   tcp_health_check {
#     port = "80"
#   }
# }




# resource "random_id" "random_suffix" {
#   byte_length = 6
# }

# resource "google_project" "backend_project_a" {
#   provider            = google
#   project_id          = "backend-project-a-${lower(random_id.random_suffix.hex)}"
#   name                = "backend-project-a"
#   org_id              = "${var.gcp-org-id}"
#   billing_account     = "${var.gcp-billing-id}"
#   auto_create_network = false
# }


# resource "google_compute_network" "backend_project_a_vpc" {
#   name                = "backend-project-a-vpc"
#   project             = google_project.backend_project_a.id 
#   auto_create_network = false
#   routing_mode        = "GLOBAL"
# }
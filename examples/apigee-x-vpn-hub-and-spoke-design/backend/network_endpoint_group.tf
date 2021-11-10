#### Create a zonal Network endpoint groups

# resource "google_compute_global_network_endpoint_group" "neg" {
#   name                  = "apigee-x-runtime-endpoint"
#   default_port          = "443"
#   network_endpoint_type = "INTERNET_FQDN_PORT"
#   endpoint              = "api.hudywu.com"
# }

### already created using 
# resource "google_compute_network" "default" {
#   name                    = "neg-network"
#   auto_create_subnetworks = false
# }

# resource "google_compute_subnetwork" "default" {
#   name          = "neg-subnetwork"
#   ip_cidr_range = "10.0.0.0/16"
#   region        = "us-central1"
#   network       = google_compute_network.default.id
# }

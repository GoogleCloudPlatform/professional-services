resource "google_compute_network" "hadoop-network" {
   name = "${var.network}"
   routing_mode = "REGIONAL" 
}

resource "google_compute_subnetwork" "hadoop-subnet" {
    name = "${var.hadoop-subnet}"
    ip_cidr_range = "${var.hadoop-cidr-range}"
    network = "${var.network}"
    private_ip_google_access = "true"
    region = "${var.history-region}"
}

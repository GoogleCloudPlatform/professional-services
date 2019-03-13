resource "google_compute_firewall" "history-ui-access" {
    name = "${var.network}-hadoop-history-ui-access"
    network = "${var.network}"
    allow = {
        protocol = "tcp"
        ports = ["18080", "19888"]
    }
    target_tags = ["hadoop-history-ui-access"]
}

resource "google_compute_firewall" "admin-ui-access" {
    name = "${var.network}-hadoop-admin-ui-access"
    network = "${var.network}"
    allow = {
        protocol = "tcp"
        ports = ["8088", "4040"]
    }
    target_tags = ["hadoop-admin-ui-access"]
}

resource "google_compute_firewall" "history-ui-access" {
    name = "${var.network}-hadoop-history-ui-access"
    network = "${var.network}"
    allow = {
        protocol = "tcp"
        ports = ["18080", "19888"]
    }
    target_tags = ["hadoop-history-ui-access"]
    source_ranges = ["${var.data-eng-cidr-range}"]
    direction = "INGRESS"
}

resource "google_compute_firewall" "admin-ui-access" {
    name = "${var.network}-hadoop-admin-ui-access"
    network = "${var.network}"
    allow = {
        protocol = "tcp"
        ports = ["8088", "4040"]
    }
    target_tags = ["hadoop-admin-ui-access"]
    source_ranges = ["${var.data-eng-cidr-range}"]
    direction = "INGRESS"
}

resource "google_compute_firewall" "allow-ssh" {
    name = "${var.network}-allow-ssh"
    network = "${var.network}"
    allow = {
        protocol = "tcp"
        ports = ["22"]
    }
    target_tags = ["hadoop-admin-ui-access"]
    source_ranges = ["${var.data-eng-cidr-range}"]
    direction = "INGRESS"
}

resource "google_compute_firewall" "deny-egress" {
    name = "${var.network}-deny-egress"
    network = "${var.network}"
    target_tags = ["hadoop-admin-ui-access"]
    direction = "EGRESS"
    destination_ranges = ["0.0.0.0/0"]
    priority = "65535"    
}

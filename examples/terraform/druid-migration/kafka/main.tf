resource "google_compute_instance" "kafka" {
  name         = "${var.kafka_name}-${count.index + 1}"
  machine_type = "${var.kafka_machine_type}"
  tags         = ["server", "kafka"]
  zone         = "${var.zone}"

  count = 3

  boot_disk {
    initialize_params {
      image = "${var.kafka_disk}"
    }
  }

  network_interface {
    network       = "${var.network}"
    access_config = {}
  }

  metadata {
    startup-script = "${data.template_file.kafka_config.rendered}"
  }

  service_account {
    scopes = ["userinfo-email", "compute-ro", "storage-ro"]
  }
}

data "template_file" "kafka_config" {
  template = "${file("${path.module}/kafka_script.sh")}"

  vars {
    zookeeper0 = "${var.zookeeper_ip_ls[0]}"
    zookeeper1 = "${var.zookeeper_ip_ls[1]}"
    zookeeper2 = "${var.zookeeper_ip_ls[2]}"
  }
}

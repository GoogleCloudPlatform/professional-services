data "template_file" "druid-startup" {
  template = "${file("${path.module}/druid_broker.sh")}"

  vars {
    bucket = "${var.bucket_name}"
  }
}

resource "google_compute_instance" "druid-broker" {
  name         = "${var.broker_node_name}-${count.index + 1}"
  machine_type = "${var.druid_broker_machine_type}"
  tags         = ["druid", "broker"]
  zone         = "${var.zone}"

  count = "${var.count}"

  boot_disk {
    initialize_params {
      image = "${var.druid_broker_disk}"
      size  = "${var.druid_broker_disk_size}"
    }
  }

  network_interface {
    network       = "${var.network}"
    access_config = {}
  }

  metadata {
    startup-script = "${data.template_file.druid-startup.rendered}"
  }

  service_account {
    scopes = ["sql-admin", "storage-rw"]
  }
}

data "template_file" "druid-startup" {
  template = "${file("${path.module}/druid_coordinator.sh")}"

  vars {
    bucket = "${var.bucket_name}"
  }
}

resource "google_compute_instance" "druid-coordinator" {
  name         = "${var.coordinator_node_name}-${count.index + 1}"
  machine_type = "${var.druid_coordinator_machine_type}"
  tags         = ["druid", "coordinator"]
  zone         = "${var.zone}"

  count = "${var.count}"

  boot_disk {
    initialize_params {
      image = "${var.druid_coordinator_disk}"
      size  = "${var.druid_coordinator_disk_size}"
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

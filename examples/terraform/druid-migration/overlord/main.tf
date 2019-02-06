data "template_file" "druid-startup" {
  template = "${file("${path.module}/druid_overlord.sh")}"

  vars {
    bucket = "${var.bucket_name}"
  }
}

resource "google_compute_instance" "druid-overlord" {
  name         = "${var.overlord_node_name}-${count.index + 1}"
  machine_type = "${var.druid_overlord_machine_type}"
  tags         = ["druid", "overlord"]
  zone         = "${var.zone}"

  count = "${var.count}"

  boot_disk {
    initialize_params {
      image = "${var.druid_overlord_disk}"
      size  = "${var.druid_overlord_disk_size}"
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

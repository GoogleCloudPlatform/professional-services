resource "google_storage_bucket_object" "zoo-init-script" {
  name    = "zookeeper_script.sh"
  content = "${data.template_file.zookeeper_config.rendered}"
  bucket  = "${var.bucket_name}"
}

resource "google_compute_instance" "zookeeper" {
  name         = "${var.zookeeper_name}-${count.index + 1}"
  machine_type = "${var.zookeeper_machine_type}"
  tags         = ["server", "zookeeper", "myid-${count.index + 1}"]
  zone         = "${var.zone}"
  count        = 3

  boot_disk {
    initialize_params {
      image = "${var.zookeeper_disk}"
    }
  }

  network_interface {
    network       = "${var.network}"
    access_config = {}
  }

  metadata {
    startup-script = "echo ${count.index + 1} > /usr/share/zookeeper.id; gsutil cp gs://${var.bucket_name}/zookeeper_script.sh /opt; chmod +x /opt/zookeeper_script.sh; /opt/./zookeeper_script.sh"
  }

  service_account {
    scopes = ["userinfo-email", "compute-ro", "storage-ro"]
  }

  depends_on = ["google_storage_bucket_object.zoo-init-script"]
}

data "template_file" "zookeeper_config" {
  template = "${file("${path.module}/zookeeper_script.sh")}"

  vars {
    zookeeper0 = "${var.zookeeper_name}-1"
    zookeeper1 = "${var.zookeeper_name}-2"
    zookeeper2 = "${var.zookeeper_name}-3"
  }
}

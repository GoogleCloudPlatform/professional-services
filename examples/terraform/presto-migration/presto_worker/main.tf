resource "google_compute_instance" "presto-worker" {
  count = "${var.presto_worker_count}"

  name         = "${var.presto_cluster_name}-w-${count.index}"
  machine_type = "${var.presto_worker_machine_type}"
  zone         = "${var.zone}"

  tags = ["presto-service-discovery"]

  boot_disk {
    initialize_params {
      size  = "${var.presto_worker_boot_disk_size_gb}"
      image = "${var.presto_cluster_image}"
    }
  }

  network_interface {
    network = "${var.network}"

    access_config {}
  }

  metadata {
    role           = "Worker"
    presto-master  = "${var.presto_cluster_name}-m"
    worker_count   = "${var.presto_worker_count}"
    startup-script = "${var.mod_startup_script}"
  }

  service_account {
    scopes = ["storage-rw"]
  }
}

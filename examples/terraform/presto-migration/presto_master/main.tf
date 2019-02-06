resource "google_compute_instance" "presto-master" {
  name         = "${var.presto_cluster_name}-m"
  machine_type = "${var.presto_master_machine_type}"
  zone         = "${var.zone}"

  tags = ["presto-service-discovery"]

  boot_disk {
    initialize_params {
      size  = "${var.presto_master_boot_disk_size_gb}"
      image = "${var.presto_cluster_image}"
    }
  }

  network_interface {
    network = "${var.network}"

    access_config {}
  }

  metadata {
    role           = "Master"
    presto-master  = "${var.presto_cluster_name}-m"
    worker_count   = "${var.presto_worker_count}"
    startup-script = "${var.mod_startup_script}"
  }

  service_account {
    scopes = ["storage-rw"]
  }
}

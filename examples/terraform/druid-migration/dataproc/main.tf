resource "google_dataproc_cluster" "ephemeral-dataproc" {
  name   = "${var.dataproc_cluster_name}"
  region = "${var.region}"

  cluster_config {
    staging_bucket = "${var.bucket_name}"

    master_config {
      num_instances = "${var.dataproc_master_count}"
      machine_type  = "${var.dataproc_master_machine_type}"

      disk_config {
        boot_disk_type    = "pd-ssd"
        boot_disk_size_gb = "${var.dataproc_master_boot_disk_size_gb}"
      }
    }

    worker_config {
      num_instances = "${var.dataproc_worker_count}"
      machine_type  = "${var.dataproc_worker_machine_type}"

      disk_config {
        boot_disk_size_gb = "${var.dataproc_worker_boot_disk_size_gb}"
      }
    }

    software_config {
      image_version = "1.3.7-deb9"
    }

    gce_cluster_config {
      service_account_scopes = [
        "https://www.googleapis.com/auth/cloud.useraccounts.readonly",
        "https://www.googleapis.com/auth/devstorage.read_write",
        "https://www.googleapis.com/auth/logging.write",
        "https://www.googleapis.com/auth/sqlservice.admin",
      ]
    }

    initialization_action {
      script      = "gs://${var.bucket_name}/dataproc_init.sh"
      timeout_sec = 500
    }
  }
}

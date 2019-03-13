resource "google_dataproc_cluster" "history-server" {
  name   = "${var.history-server}"
  region = "${var.history-region}"

  cluster_config {
    master_config {
      num_instances = 1
      machine_type  = "n1-standard-1"

      disk_config {
        boot_disk_type    = "pd-standard"
        boot_disk_size_gb = 50
      }
    }

    software_config {
      image_version = "preview"

      override_properties = {
        "dataproc:dataproc.allow.zero.workers"              = "true"
        "mapred:mapreduce.jobhistory.done-dir"              = "gs://${var.history-bucket}/done-dir"
        "mapred:mapreduce.jobhistory.intermediate-done-dir" = "gs://${var.history-bucket}/intermediate-done-dir"
        "spark:spark.eventLog.dir"                          = "gs://${var.history-bucket}/spark-events/"
        "spark:spark.history.fs.logDirectory"               = "gs://${var.history-bucket}/spark-events/"
      }
    }

    gce_cluster_config {
      network = "${var.network}"
      tags    = ["hadoop-history-ui-access"]
    }
  }
}

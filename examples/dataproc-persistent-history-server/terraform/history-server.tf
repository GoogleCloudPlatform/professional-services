/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

resource "google_dataproc_cluster" "history-server" {
  depends_on = [
    "google_storage_bucket_object.spark-events-dir",
  ]

  project = "${var.project}"
  name    = "${var.history-server}"
  region  = "${var.history-region}"

  cluster_config {
    master_config {
      num_instances = 1
      machine_type  = "n1-standard-4"

      disk_config {
        boot_disk_type    = "pd-standard"
        boot_disk_size_gb = 50
      }
    }

    software_config {
      image_version = "1.4.0-debian9"

      override_properties = {
        "dataproc:dataproc.allow.zero.workers"              = "true"
        "yarn:yarn.log-aggregation-enable"                  = "true"
        "yarn:yarn.nodemanager.remote-app-log-dir"          = "gs://${var.history-bucket}/yarn/logs/"
        "yarn:yarn.log-aggregation.retain-seconds"          = "604800"
        "yarn:yarn.log.server.url"                          = "http://${var.history-server}-m:19888/jobhistory/logs"
        "mapred:mapreduce.jobhistory.always-scan-user-dir"  = "true"
        "mapred:mapreduce.jobhistory.address"               = "${var.history-server}-m:10020"
        "mapred:mapreduce.jobhistory.webapp.address"        = "${var.history-server}-m:19888"
        "mapred:mapreduce.jobhistory.done-dir"              = "gs://${var.history-bucket}/done-dir"
        "mapred:mapreduce.jobhistory.intermediate-done-dir" = "gs://${var.history-bucket}/intermediate-done-dir"
        "spark:spark.eventLog.dir"                          = "gs://${var.history-bucket}/spark-events/"
        "spark:spark.history.fs.logDirectory"               = "gs://${var.history-bucket}/spark-events/"
        "spark:spark.ui.enabled"                            = "true"
        "spark:spark.ui.filters"                            = "org.apache.spark.deploy.yarn.YarnProxyRedirectFilter"
        "spark:spark.yarn.historyServer.address"            = "${var.history-server}-m:18080"
      }
    }

    gce_cluster_config {
      subnetwork = "${module.vpc.subnets_names[0]}"
      tags       = ["hadoop-history-ui-access"]

      metadata {
        "enable-oslogin" = "TRUE"
      }
    }
  }
}

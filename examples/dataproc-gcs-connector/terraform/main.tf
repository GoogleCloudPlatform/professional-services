# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

resource "google_storage_bucket" "init_actions" {
  name     = "gcs-connector-init_actions"
  location = var.region
  project  = var.project_id
}

resource "google_storage_bucket_object" "gcs_connector_jar" {
  name   = "gcs-connector-${var.hadoop_version}-shaded.jar"
  source = "../hadoop-connectors/gcs/target/gcs-connector-${var.hadoop_version}-SNAPSHOT-shaded.jar"
  bucket = "gcs-connector-init_actions"
}

resource "google_storage_bucket_object" "init_script" {
  name   = "dataproc-init-script.sh"
  source = "../connectors.sh"
  bucket = "gcs-connector-init_actions"
}

resource "google_dataproc_cluster" "dataproc-cluster" {

  project = var.project_id
  name    = var.dataproc_cluster
  region  = var.region

  cluster_config {

    initialization_action {
      script      = "gs://gcs-connector-init_actions/dataproc-init-script.sh"
      timeout_sec = 500
    }

    master_config {
      num_instances = 1
      machine_type  = "n1-standard-1"

      disk_config {
        boot_disk_type    = "pd-standard"
        boot_disk_size_gb = 20
      }
    }

    worker_config {
      num_instances = 2
      machine_type  = "n1-standard-1"

      disk_config {
        boot_disk_type    = "pd-standard"
        boot_disk_size_gb = 20
        num_local_ssds    = 1
      }
    }

    software_config {
      image_version = "1.3.51-debian9"
    }

    gce_cluster_config {
      subnetwork = google_compute_subnetwork.dataproc.self_link
      metadata = {
        gcs-connector-version = element(split("-", var.hadoop_version), 1)
      }
    }
  }
}

resource "google_compute_firewall" "dataproc_internal" {
  name    = "dataproc-allow-internal"
  project = var.project_id
  network = google_compute_network.ingestion.self_link

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports    = ["1-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["1-65535"]
  }

  source_ranges = [google_compute_subnetwork.dataproc.ip_cidr_range]
}

resource "google_compute_network" "ingestion" {
  project                 = var.project_id
  name                    = var.network_name
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "dataproc" {
  project                  = var.project_id
  name                     = var.dataproc_subnet
  ip_cidr_range            = "10.2.0.0/16"
  region                   = var.region
  network                  = google_compute_network.ingestion.self_link
  private_ip_google_access = true
}

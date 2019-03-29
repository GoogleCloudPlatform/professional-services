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

resource "google_storage_bucket" "history-bucket" {
  project       = "${var.project}"
  name          = "${var.history-bucket}"
  storage_class = "REGIONAL"
  location      = "${var.history-region}"

  lifecycle_rule = {
    action = {
      type = "Delete"
    }

    condition = {
      age = 30
    }
  }
}

# Spark needs the spark-events directory to already exist.
resource "google_storage_bucket_object" "spark-events-dir" {
  bucket       = "${google_storage_bucket.history-bucket.name}"
  name         = "spark-events/.keep"
  content      = " "
  content_type = "application/x-www-form-urlencoded;charset=UTF-8"
}

resource "google_storage_bucket_object" "disable-history-servers-init-action" {
  bucket       = "${google_storage_bucket.history-bucket.name}"
  name         = "init_actions/disable_history_servers.sh"
  source       = "../init_actions/disable_history_servers.sh"
  content_type = "application/x-www-form-urlencoded;charset=UTF-8"
}

resource "google_storage_bucket_object" "history-server-yaml" {
  bucket       = "${google_storage_bucket.history-bucket.name}"
  name         = "cluster_templates/history-server.yaml"
  source       = "../cluster_templates/history-server.yaml"
  content_type = "application/x-www-form-urlencoded;charset=UTF-8"
}

resource "google_storage_bucket_object" "ephemeral-cluster-yaml" {
  bucket       = "${google_storage_bucket.history-bucket.name}"
  name         = "cluster_templates/ephemeral-cluster.yaml"
  source       = "../cluster_templates/ephemeral-cluster.yaml"
  content_type = "application/x-www-form-urlencoded;charset=UTF-8"
}

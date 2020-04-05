/**
 * Copyright 2020 Google LLC
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


resource "google_storage_bucket" "cloud-function-code" {
  name     = var.bucket_name
  location = var.bucket_location
  project  = var.project_id
  logging {
    log_bucket = format("%s-project-sink", var.project_id)
  }
}

data "archive_file" "function-source" {
  type        = "zip"
  output_path = "${path.module}/function-source.zip"

  source {
    content  = "${file("${path.module}/js/config.json")}"
    filename = "config.json"
  }

  source {
    content  = "${file("${path.module}/js/index.js")}"
    filename = "index.js"
  }

  source {
    content  = "${file("${path.module}/js/package.json")}"
    filename = "package.json"
  }
}

resource "google_storage_bucket_object" "archive" {
  name   = "function-source.zip"
  bucket = google_storage_bucket.cloud-function-code.name
  source = "${path.module}/function-source.zip"
}

/*
resource "google_storage_bucket_object" "config_json" {
  name   = "config.json"
  bucket = var.bucket_name
  source = "${path.module}/js/config.json"
  depends_on = [data.archive_file.function-source]
}
*/

resource "google_cloudfunctions_function" "subscribeMailgun" {
  name                = "subscribeMailgun"
  project             = var.project_id
  entry_point         = "subscribeMailgun"
  runtime             = "nodejs10"
  available_memory_mb = 256
  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = "cloud-builds"
  }
  source_archive_bucket = google_storage_bucket.cloud-function-code.name
  source_archive_object = google_storage_bucket_object.archive.output_name
  service_account_email = var.service_account_email
}

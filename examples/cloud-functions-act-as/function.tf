/**
 * Copyright 2022 Google LLC
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

 data "archive_file" "function_zip" {
  type        = "zip"
  source_dir = "${path.module}/function"
  output_path = "${path.module}/.tmp/sample-function.zip"
}


resource "random_string" "bucket_suffix" {
  length           = 4
  special          = false
  lower            = true
  upper            = false
}


resource "google_storage_bucket" "bucket" {
  project     = var.project_id
  location    = var.location
  name        = "cf-sample-bucket-${random_string.bucket_suffix.id}"
  force_destroy = true
  uniform_bucket_level_access = true
}

resource "google_storage_bucket_object" "archive" {
  name   = format("cf-wif-%s.zip", data.archive_file.function_zip.output_md5)
  bucket = google_storage_bucket.bucket.name
  source = data.archive_file.function_zip.output_path
}

resource "google_cloudfunctions_function" "function" {
  project     = var.project_id
  region      = var.location
  name        = "sample-function"
  description = "Impersonates the caller"
  runtime     = "python39"
  service_account_email = google_service_account.cf-sample-account.email

  available_memory_mb   = 256
  source_archive_bucket = google_storage_bucket_object.archive.bucket
  source_archive_object = google_storage_bucket_object.archive.name
  timeout               = 60
  entry_point           = "hello_world"
  trigger_http          = true
  /* event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource = "projects/${var.project_id}/topics/${google_pubsub_topic.cert-management-ilb.name}"
  } */
  environment_variables = {
    GCP_PROJECT     = var.project_id
    GCP_ZONE        = var.zone
  }
  build_environment_variables = {
    GOOGLE_FUNCTION_SOURCE = "main.py"
  }
}

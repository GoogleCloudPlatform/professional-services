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

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_service_account" "service_account" {
  account_id   = var.service_acct_name
  display_name = "Service Account for BQ email exports"
}

resource "google_project_iam_binding" "iam_bq_admin" {
  project = var.project_id
  role    = "roles/bigquery.admin"

  members = [
    "serviceAccount:${google_service_account.service_account.email}",
  ]
}

resource "google_project_iam_binding" "iam_storage_admin" {
  project = var.project_id
  role    = "roles/storage.admin"

  members = [
    "serviceAccount:${google_service_account.service_account.email}",
  ]
}

resource "google_project_iam_binding" "iam_token_creator" {
  project = var.project_id
  role    = "roles/iam.serviceAccountTokenCreator"

  members = [
    "serviceAccount:${google_service_account.service_account.email}",
  ]
}

resource "google_bigquery_dataset" "bq_dataset" {
  dataset_id = var.bq_dataset
  location   = var.location
}

resource "google_storage_bucket" "json_bucket" {
  name     = var.storage_bucket
  location = var.location
  lifecycle_rule {
    condition {
      age = var.bucket_lifecycle
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_pubsub_topic" "topic" {
  name = var.topic_name
}

resource "google_app_engine_application" "app" {
  project     = var.project_id
  location_id = "us-central"
}

resource "google_cloud_scheduler_job" "job" {
  name      = var.scheduler_name
  schedule  = var.scheduler_schedule
  time_zone = var.scheduler_timezone

  pubsub_target {
    topic_name = google_pubsub_topic.topic.id
    data       = filebase64("payload.txt")
  }
}

resource "google_storage_bucket" "function_bucket" {
  name = var.function_bucket
}

resource "google_storage_bucket_object" "archive" {
  name   = "main.zip"
  bucket = google_storage_bucket.function_bucket.name
  source = "main.zip"
}

resource "google_cloudfunctions_function" "function" {
  name    = var.function_name
  runtime = "python37"

  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = google_pubsub_topic.topic.id
  }

  service_account_email = google_service_account.service_account.email
  source_archive_bucket = google_storage_bucket.function_bucket.name
  source_archive_object = google_storage_bucket_object.archive.name
  entry_point           = "main"

  environment_variables = {
    SENDGRID_API_KEY = var.sendgrid_api_key
  }
}


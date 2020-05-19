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
  version = "~> 3.21.0"
  project = var.project_id
  region  = var.region
}

module "project-services" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "4.0.0"

  project_id = var.project_id

  activate_apis = [
    "bigquery.googleapis.com",
    "cloudfunctions.googleapis.com",
    "storage.googleapis.com",
    "cloudscheduler.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "pubsub.googleapis.com",
  ]
}

resource "google_service_account" "service_account" {
  account_id   = var.service_acct_name
  project      = module.project-services.project_id
  display_name = "Service Account for BQ email exports"
}

resource "google_project_iam_binding" "sa_binding" {
  for_each = toset(var.service_acct_roles)
  project  = module.project-services.project_id
  role     = each.key

  members = [
    "serviceAccount:${google_service_account.service_account.email}",
  ]
}

resource "google_bigquery_dataset" "bq_dataset" {
  dataset_id = var.bq_dataset
  project    = module.project-services.project_id
  location   = var.location
}

resource "google_storage_bucket" "json_bucket" {
  name          = var.storage_bucket
  project       = module.project-services.project_id
  location      = var.location
  force_destroy = true
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
  name    = var.topic_name
  project = module.project-services.project_id
}

resource "google_app_engine_application" "app" {
  project     = module.project-services.project_id
  location_id = "us-central"
}

data "template_file" "payload" {
  template = "${file("payload.txt")}"
  vars = {
    project_id = "${var.project_id}"
    bq_dataset = "${var.bq_dataset}"
    bucket     = "${var.storage_bucket}"
  }
}

resource "google_cloud_scheduler_job" "job" {
  name      = var.scheduler_name
  project   = module.project-services.project_id
  schedule  = var.scheduler_schedule
  time_zone = var.scheduler_timezone

  pubsub_target {
    topic_name = google_pubsub_topic.topic.id
    data       = base64encode(data.template_file.payload.rendered)
  }

  depends_on = [google_app_engine_application.app]
}

resource "google_storage_bucket" "function_bucket" {
  name          = var.function_bucket
  project       = module.project-services.project_id
  force_destroy = true
}

data "archive_file" "init" {
  type        = "zip"
  source_dir  = "../source"
  output_path = "source.zip"
}


resource "google_storage_bucket_object" "archive" {
  name   = "source.zip"
  bucket = google_storage_bucket.function_bucket.name
  source = "source.zip"
}

resource "google_cloudfunctions_function" "function" {
  name    = var.function_name
  project = module.project-services.project_id
  runtime = "python37"

  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = google_pubsub_topic.topic.id
  }

  service_account_email = google_service_account.service_account.email
  source_archive_bucket = google_storage_bucket.function_bucket.name
  source_archive_object = google_storage_bucket_object.archive.name
  entry_point           = "main"
  timeout               = 540

  environment_variables = {
    SENDGRID_API_KEY = var.sendgrid_api_key
  }
}
# Copyright 2020 Google Inc.
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
    "cloudresourcemanager.googleapis.com",
    "appengine.googleapis.com",
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

# Topic that triggers function 1 that runs query
resource "google_pubsub_topic" "topic_1" {
  name    = var.topic_name_1
  project = module.project-services.project_id
}

# Topic that triggers function 2 that runs export job
resource "google_pubsub_topic" "topic_2" {
  name    = var.topic_name_2
  project = module.project-services.project_id
}

# Topic that triggers function 3 that sends email
resource "google_pubsub_topic" "topic_3" {
  name    = var.topic_name_3
  project = module.project-services.project_id
}

resource "google_app_engine_application" "app" {
  project     = module.project-services.project_id
  location_id = "us-central"
}

resource "google_cloud_scheduler_job" "job" {
  name      = var.scheduler_name
  project   = module.project-services.project_id
  schedule  = var.scheduler_schedule
  time_zone = var.scheduler_timezone

  pubsub_target {
    topic_name = google_pubsub_topic.topic_1.id
    data       = base64encode("BQ automated email export trigger")
  }

  depends_on = [google_app_engine_application.app]
}

resource "google_logging_project_sink" "query_sink" {
  name        = var.query_logging_sink_name
  destination = "pubsub.googleapis.com/projects/${var.project_id}/topics/${google_pubsub_topic.topic_2.name}"
  filter      = "protoPayload.serviceName: BigQuery protoPayload.resourceName:\"projects/${var.project_id}/jobs/email_query\" protoPayload.methodName: jobcompleted"

  unique_writer_identity = true
}

resource "google_logging_project_sink" "export_sink" {
  name        = var.export_logging_sink_name
  destination = "pubsub.googleapis.com/projects/${var.project_id}/topics/${google_pubsub_topic.topic_3.name}"
  filter      = "protoPayload.serviceName: BigQuery protoPayload.resourceName:\"projects/${var.project_id}/jobs/email_export\" protoPayload.methodName: jobcompleted"

  unique_writer_identity = true
}

resource "google_project_iam_binding" "log_sink_writer" {
  role = "roles/pubsub.publisher"

  members = [
    google_logging_project_sink.export_sink.writer_identity,
    google_logging_project_sink.query_sink.writer_identity,
  ]
}

# Function 1 which will run the BigQuery query
resource "google_storage_bucket" "function_bucket_1" {
  name    = var.function_bucket_1
  project = module.project-services.project_id
}

data "archive_file" "init_1" {
  type        = "zip"
  source_dir  = "../scheduled_query_function"
  output_path = "scheduled_query_function_source.zip"
}

resource "google_storage_bucket_object" "archive_1" {
  name   = "scheduled_query_function_source.zip"
  bucket = google_storage_bucket.function_bucket_1.name
  source = data.archive_file.init_1.output_path
}

resource "google_cloudfunctions_function" "function_1" {
  name    = var.run_query_function_name
  project = module.project-services.project_id
  runtime = "python37"

  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = google_pubsub_topic.topic_1.id
  }

  service_account_email = google_service_account.service_account.email
  source_archive_bucket = google_storage_bucket.function_bucket_1.name
  source_archive_object = google_storage_bucket_object.archive_1.name
  entry_point           = "main"
  timeout               = 540

  environment_variables = {
    GCS_QUERY_PATH      = var.gcs_query_path
    ALLOW_LARGE_RESULTS = var.allow_large_results
    USE_QUERY_CACHE     = var.use_query_cache
    FLATTEN_RESULTS     = var.flatten_results
    MAX_BYTES_BILLED    = var.max_bytes_billed
    USE_LEGACY_SQL      = var.use_legacy_sql
  }
}

# Function 2 which will export query results to GCS
resource "google_storage_bucket" "function_bucket_2" {
  name    = var.function_bucket_2
  project = module.project-services.project_id
}

data "archive_file" "init_2" {
  type        = "zip"
  source_dir  = "../export_query_results_function"
  output_path = "export_query_results_function_source.zip"
}

resource "google_storage_bucket_object" "archive_2" {
  name   = "export_query_results_function_source.zip"
  bucket = google_storage_bucket.function_bucket_2.name
  source = data.archive_file.init_2.output_path
}

resource "google_cloudfunctions_function" "function_2" {
  name    = var.export_results_function_name
  project = module.project-services.project_id
  runtime = "python37"

  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = google_pubsub_topic.topic_2.id
  }

  service_account_email = google_service_account.service_account.email
  source_archive_bucket = google_storage_bucket.function_bucket_2.name
  source_archive_object = google_storage_bucket_object.archive_2.name
  entry_point           = "main"
  timeout               = 540

  environment_variables = {
    BUCKET_NAME     = var.storage_bucket
    OBJECT_NAME     = var.export_object_name
    COMPRESSION     = var.export_compression
    DEST_FMT        = var.export_destination_format
    USE_AVRO_TYPES  = var.export_use_avro_logical_types
    FIELD_DELIMITER = var.export_field_delimiter
  }
}

# Function 3 which will send email with link to GCS file
resource "google_storage_bucket" "function_bucket_3" {
  name    = var.function_bucket_3
  project = module.project-services.project_id
}

data "archive_file" "init_3" {
  type        = "zip"
  source_dir  = "../send_email_function"
  output_path = "send_email_function_source.zip"
}

resource "google_storage_bucket_object" "archive_3" {
  name   = "send_email_function_source.zip"
  bucket = google_storage_bucket.function_bucket_3.name
  source = data.archive_file.init_3.output_path
}

resource "google_cloudfunctions_function" "function_3" {
  name    = var.email_results_function_name
  project = module.project-services.project_id
  runtime = "python37"

  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = google_pubsub_topic.topic_3.id
  }

  service_account_email = google_service_account.service_account.email
  source_archive_bucket = google_storage_bucket.function_bucket_3.name
  source_archive_object = google_storage_bucket_object.archive_3.name
  entry_point           = "main"
  timeout               = 540

  environment_variables = {
    SENDGRID_API_KEY      = var.sendgrid_api_key
    SIGNED_URL_EXPIRATION = var.signed_url_expiration_hrs
    FROM_EMAIL            = var.sender_email_address
    TO_EMAILS             = var.recipient_email_address
    EMAIL_SUBJECT         = var.email_subject
  }
}
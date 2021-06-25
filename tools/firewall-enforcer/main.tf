# Copyright 2021 Google, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Create a feed that sends notifications about compute instance updates under a
# particular organization.
resource "google_cloud_asset_organization_feed" "main" {
  provider        = google-beta
  billing_project = var.project_id
  org_id          = var.org_id
  feed_id         = var.feed_id
  content_type    = "RESOURCE"

  asset_types = [
    "compute.googleapis.com/Firewall",
  ]

  condition {
    expression  = "!temporal_asset.deleted"
    title       = "Not deleted"
    description = "Send notification only when created"
  }

  feed_output_config {
    pubsub_destination {
      topic = google_pubsub_topic.feed_output.id
    }
  }

  depends_on = [
    google_project_service.cloudasset
  ]
}

# Allow the publishing role to the Cloud Asset service account of the project that
# was used for sending the notifications.
resource "google_pubsub_topic_iam_member" "cloud_asset_writer" {
  project = var.project_id
  topic   = google_pubsub_topic.feed_output.id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-cloudasset.iam.gserviceaccount.com"

  # Wait for the permission to be ready on the destination topic.
  depends_on = [
    google_cloud_asset_organization_feed.main
  ]
}

# The topic where the resource change notifications will be sent.
resource "google_pubsub_topic" "feed_output" {
  project = var.project_id
  name    = var.feed_id
  depends_on = [
    google_project_service.pubsub,
    google_project_service.rm
  ]
}

# Bucket to hold function code
resource "google_storage_bucket" "bucket" {
  name                        = "${var.project_id}-fw"
  uniform_bucket_level_access = true
}

# zip up cloud function
data "archive_file" "function_archive" {
  type        = "zip"
  source_dir  = "./function/"
  output_path = "./function/index.zip"
}

# function source code
resource "google_storage_bucket_object" "archive" {
  name                = "${data.archive_file.function_archive.output_md5}-index"
  bucket              = google_storage_bucket.bucket.name
  source              = data.archive_file.function_archive.output_path
  content_disposition = "attachment"
  content_encoding    = "gzip"
  content_type        = "application/zip"
}

# service account that runs cloud function
resource "google_service_account" "function" {
  account_id   = var.function_sa_name
  display_name = var.function_sa_name
}

resource "google_cloudfunctions_function" "function" {
  name                  = "firewall-enforcer"
  description           = "Deletes firewall rules"
  runtime               = "python39"
  service_account_email = google_service_account.function.email
  source_archive_bucket = google_storage_bucket.bucket.name
  source_archive_object = google_storage_bucket_object.archive.name
  entry_point           = "main"
  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = google_pubsub_topic.feed_output.id
  }
}

# Find the project number of the project whose identity will be used for sending
# the asset change notifications.
data "google_project" "project" {
  project_id = var.project_id
}

resource "google_project_service" "cloudasset" {
  project = var.project_id
  service = "cloudasset.googleapis.com"
}

resource "google_project_service" "functions" {
  project = var.project_id
  service = "cloudfunctions.googleapis.com"
}

resource "google_project_service" "pubsub" {
  project = var.project_id
  service = "pubsub.googleapis.com"
}

resource "google_project_service" "build" {
  project = var.project_id
  service = "cloudbuild.googleapis.com"
}

resource "google_project_service" "rm" {
  project = var.project_id
  service = "cloudresourcemanager.googleapis.com"
}

resource "google_organization_iam_member" "function" {
  org_id = var.org_id
  member = "serviceAccount:${google_service_account.function.email}"
  role   = "roles/compute.securityAdmin"
}

resource "google_project_iam_member" "function_logger" {
  project = var.project_id
  member  = "serviceAccount:${google_service_account.function.email}"
  role    = "roles/logging.logWriter"
}

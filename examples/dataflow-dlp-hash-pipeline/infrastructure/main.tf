# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

locals {
  df_bucket = var.dataflow_bucket == "" ? "${var.project}-dataflow" : var.dataflow_bucket
  df_member = "serviceAccount:${google_service_account.df_worker.email}"
  api_set = toset([
    "iam.googleapis.com",
    "dlp.googleapis.com",
    "secretmanager.googleapis.com",
    "firestore.googleapis.com",
    "dataflow.googleapis.com",
    "compute.googleapis.com",
  ])
}

resource "random_id" "salt" {
  byte_length = var.salt_byte_length
}

resource "google_project_service" "project_services" {
  for_each                   = local.api_set
  project                    = var.project
  service                    = each.value
  disable_on_destroy         = false
  disable_dependent_services = false
}

##################################################
##                 Dataflow                     ##
##################################################

# Create the bucket where dataflow will write staging and temp data
resource "google_storage_bucket" "df_bucket" {
  project       = var.project
  name          = local.df_bucket
  location      = "US"
  force_destroy = true

  depends_on = [google_project_service.project_services]
}

resource "google_service_account" "df_worker" {
  project      = var.project
  account_id   = "df-worker"
  display_name = "Service Account attached to Dataflow job workers"

  depends_on = [google_project_service.project_services]
}

resource "google_secret_manager_secret" "hash_key_secret" {
  provider = google-beta
  project  = var.project

  secret_id = var.secret_name

  replication {
    automatic = true
  }
  depends_on = [google_project_service.project_services]
}

resource "google_pubsub_topic" "input_topic" {
  project = var.project
  name    = var.input_topic

  depends_on = [google_project_service.project_services]
}

resource "google_pubsub_subscription" "input_sub" {
  project = var.project
  name    = "${var.input_topic}-subscription"
  topic   = google_pubsub_topic.input_topic.name

  depends_on = [google_project_service.project_services]
}

resource "google_pubsub_topic" "output_topic" {
  project = var.project
  name    = var.output_topic

  depends_on = [google_project_service.project_services]
}

resource "google_pubsub_subscription" "output_sub" {
  project = var.project
  name    = "${var.output_topic}-subscription"
  topic   = google_pubsub_topic.output_topic.name

  depends_on = [google_project_service.project_services]
}
##################################################
##             GCS Notification                 ##
##################################################
resource "google_storage_notification" "notification" {
  for_each       = toset(var.buckets_to_monitor)
  bucket         = each.value
  payload_format = "JSON_API_V1"
  topic          = google_pubsub_topic.input_topic.id
  event_types    = ["OBJECT_FINALIZE"]

  depends_on = [google_pubsub_topic_iam_member.binding]
}
data "google_storage_project_service_account" "gcs_account" {}

resource "google_pubsub_topic_iam_member" "binding" {
  topic   = google_pubsub_topic.input_topic.id
  role    = "roles/pubsub.publisher"
  member = "serviceAccount:${data.google_storage_project_service_account.gcs_account.email_address}"
}

resource "local_file" "makefile_vars" {
  content  = <<EOF
PROJECT         := ${var.project}
SECRET          := ${google_secret_manager_secret.hash_key_secret.name}
REGION          := ${var.region}
BUCKET          := ${google_storage_bucket.df_bucket.name}
SALT            := ${random_id.salt.hex}
SERVICE_ACCOUNT := ${google_service_account.df_worker.email}
COLLECTION      := ${var.firestore_collection}
INPUT_SUB       := ${google_pubsub_subscription.input_sub.id}
OUTPUT_TOPIC    := ${google_pubsub_topic.output_topic.id}
OUTPUT_SUB      := ${google_pubsub_subscription.output_sub.id}
EOF
  filename = "../terraform-vars.mk"
}


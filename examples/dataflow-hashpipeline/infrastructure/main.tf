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
  cf_bucket = var.cloudfunction_bucket == "" ? "${var.project}-cloudfunction" : var.cloudfunction_bucket
  cf_member = "serviceAccount:${google_service_account.cf_runner.email}"
}

resource "random_id" "salt" {
  byte_length = var.salt_byte_length
}

##################################################
##                 Dataflow                     ##
##################################################

# Create the bucket where dataflow will write staging and temp data
resource "google_storage_bucket" "df_bucket" {
  project = var.project
  name          = local.df_bucket
  location      = "US"
  force_destroy = true
}

# Create test bucket that Cloud Function will listen on 
resource "google_storage_bucket" "test_bucket" {
  project = var.project
  name          = "${var.project}-test"
  location      = "US"
  force_destroy = true
}


resource "google_service_account" "df_worker" {
  project = var.project
  account_id   = "df-worker"
  display_name = "Service Account attached to Dataflow job workers"
}

resource "google_secret_manager_secret" "hash_key_secret" {
  provider = google-beta
  project = var.project

  secret_id = var.secret_name

  replication {
    automatic = true
  }
}

resource "google_pubsub_topic" "input_topic" {
  project = var.project
  name = var.input_topic
}

resource "google_pubsub_subscription" "input_sub" {
  project = var.project
  name    = "${var.input_topic}-subscription"
  topic   = google_pubsub_topic.input_topic.name
}

resource "google_pubsub_topic" "output_topic" {
  project = var.project
  name = var.output_topic
}

resource "google_pubsub_subscription" "output_sub" {
  project = var.project
  name    = "${var.output_topic}-subscription"
  topic   = google_pubsub_topic.output_topic.name
}

##################################################
##              Cloud Function                  ##
##################################################

resource "google_storage_bucket" "cf_bucket" {
  project = var.project
  name          = local.cf_bucket
  location      = "US"
  force_destroy = true
}

data "archive_file" "cf" {
  type        = "zip"
  source_dir = "hashpipeline-trigger"
  # NOTE: The MD5 here is to force function recreation if the contents of the
  # function change, which wouldn't happen if the zip was named statically
  output_path = "hashpipeline-${filemd5("hashpipeline-trigger/main.py")}.zip"
}

resource "google_storage_bucket_object" "archive" {
  name   = data.archive_file.cf.output_path
  bucket = google_storage_bucket.cf_bucket.name
  source = data.archive_file.cf.output_path
}

resource "google_service_account" "cf_runner" {
  project = var.project
  account_id   = "cf-runner"
  display_name = "Service Account that runs the Cloud Function"
}

resource "google_cloudfunctions_function" "function" {
  project = var.project
  region = var.region
  name        = "run-dataflow"
  description = "Runs the hashpipeline dataflow job"
  runtime     = "python37"
  
  service_account_email = google_service_account.cf_runner.email
  available_memory_mb   = 128
  source_archive_bucket = google_storage_bucket.cf_bucket.name
  source_archive_object = google_storage_bucket_object.archive.name
  timeout               = 60
  entry_point           = "trigger_dataflow"
  event_trigger {
    event_type = "google.storage.object.finalize"
    resource = google_storage_bucket.test_bucket.name
  }
  
  environment_variables = {
    TOPIC = google_pubsub_topic.input_topic.id
  }
}

resource "local_file" "makefile_vars" {
    content     = <<EOF
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


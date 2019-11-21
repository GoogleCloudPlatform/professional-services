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
}

# Enable APIs; Must be individual resources or else it will disable all other APIs for the project.
resource "google_project_service" "billingapi" {
  service = "cloudbilling.googleapis.com"
}

resource "google_project_service" "schedulerapi" {
  service = "cloudscheduler.googleapis.com"
}

resource "google_project_service" "pubsubapi" {
  service = "pubsub.googleapis.com"
}

resource "google_project_service" "cfapi" {
  service = "cloudfunctions.googleapis.com"
}

resource "google_project_service" "bqapi" {
  service = "bigquery-json.googleapis.com"
}

resource "google_project_service" "gaeapi" {
  service = "appengine.googleapis.com"
}

resource "google_project_service" "nlpapi" {
  service = "language.googleapis.com"
}

resource "google_project_service" "speechapi" {
  service = "speech.googleapis.com"
}

resource "google_project_service" "commentanalyzerapi" {
  service = "commentanalyzer.googleapis.com"
}

resource "random_id" "rand" {
  byte_length = 10
}

# Create GCS Buckets
# Create GCS Bucket to hold audio files on upload before they are processed by pipeline.
resource "google_storage_bucket" "staging_audio_bucket" {
  name = "staging-audio-files-${random_id.rand.hex}"
}

# Create GCS Bucket to hold audio files that have completed going through the pipeline.
resource "google_storage_bucket" "processed_audio_bucket" {
  name = "processed-audio-files-${random_id.rand.hex}"
}

# Create GCS Bucket to hold audio files that failed after going through STT API.
resource "google_storage_bucket" "error_audio_bucket" {
  name = "error-audio-files-${random_id.rand.hex}"
}

# Create GCS Bucket to hold transcription output files
resource "google_storage_bucket" "transcription_bucket" {
  name = "transcription-files-${random_id.rand.hex}"
}

# Create GCS Bucket to hold toxicity output files
resource "google_storage_bucket" "output_bucket" {
  name = "output-files-${random_id.rand.hex}"
}

# Create PubSub resources
resource "google_pubsub_topic" "stt_topic" {
  name       = var.stt_queue_topic_name
  depends_on = ["google_project_service.pubsubapi"]
}

resource "google_pubsub_subscription" "pull_stt_ids" {
  name       = var.stt_queue_subscription_name
  depends_on = ["google_project_service.pubsubapi"]
  topic      = google_pubsub_topic.stt_topic.name
}


# Zip up NLP API source code folder
data "archive_file" "nlp_api_function" {
  type        = "zip"
  output_path = "nlp.zip"
  source_dir  = "../nlp_api_function"
}

# Zip up Perspective API source code folder
data "archive_file" "perspective_api_function" {
  type        = "zip"
  output_path = "perspective.zip"
  source_dir  = "../perspective_api_function"
}

# Zip up Read STT source code folder
data "archive_file" "read_stt" {
  type        = "zip"
  output_path = "read_stt.zip"
  source_dir  = "../read_stt_api_function"
}

# Zip up Send STT source code folder
data "archive_file" "send_stt" {
  type        = "zip"
  output_path = "send_stt.zip"
  source_dir  = "../send_stt_api_function"
}

# Store STT source code
resource "google_storage_bucket" "function_source_code" {
  name = "source-code-${random_id.rand.hex}"
}

resource "google_storage_bucket_object" "send_stt_code" {
  name   = "send_stt_api_source"
  bucket = google_storage_bucket.function_source_code.name
  source = "send_stt.zip"
}

resource "google_storage_bucket_object" "read_stt_code" {
  name   = "read_stt_api_source"
  bucket = google_storage_bucket.function_source_code.name
  source = "read_stt.zip"
}


resource "google_storage_bucket_object" "perspective_code" {
  name   = "perspective_api_source"
  bucket = google_storage_bucket.function_source_code.name
  source = "perspective.zip"
}


resource "google_storage_bucket_object" "nlp_code" {
  name   = "nlp_api_source"
  bucket = google_storage_bucket.function_source_code.name
  source = "nlp.zip"
}


resource "google_cloudfunctions_function" "send_stt_api" {
  depends_on  = ["google_project_service.speechapi", "google_pubsub_topic.stt_topic"]
  name        = "send_stt_api"
  region      = var.cloud_functions_region
  entry_point = "main"
  runtime     = "python37"
  environment_variables = {
    topic_name         = google_pubsub_topic.stt_topic.name
    error_audio_bucket = google_storage_bucket.error_audio_bucket.name
  }
  source_archive_bucket = google_storage_bucket.function_source_code.name
  source_archive_object = google_storage_bucket_object.send_stt_code.name
  timeout               = "540"
  event_trigger {
    resource   = google_storage_bucket.staging_audio_bucket.name
    event_type = "google.storage.object.finalize"
  }
}

resource "google_cloudfunctions_function" "read_stt_api" {
  depends_on  = ["google_project_service.speechapi"]
  name        = "read_stt_api"
  region      = var.cloud_functions_region
  entry_point = "main"
  runtime     = "python37"
  environment_variables = {
    topic_name             = google_pubsub_topic.stt_topic.name
    subscription_name      = google_pubsub_subscription.pull_stt_ids.name
    transcription_bucket   = google_storage_bucket.transcription_bucket.name
    staging_audio_bucket   = google_storage_bucket.staging_audio_bucket.name
    processed_audio_bucket = google_storage_bucket.processed_audio_bucket.name
    error_audio_bucket     = google_storage_bucket.error_audio_bucket.name
  }
  source_archive_bucket = google_storage_bucket.function_source_code.name
  source_archive_object = google_storage_bucket_object.read_stt_code.name
  timeout               = "540"
  event_trigger {
    resource   = var.cron_topic_name
    event_type = "google.pubsub.topic.publish"
  }
}

resource "google_cloud_scheduler_job" "scheduler_job" {
  name       = "check_stt_job"
  region     = var.app_engine_region
  depends_on = ["google_project_service.schedulerapi"]
  schedule   = var.scheduler_frequency
  pubsub_target {
    topic_name = "projects/${var.project_id}/topics/${var.cron_topic_name}"
    data       = "data"
  }
}

resource "google_cloudfunctions_function" "perspective_api" {
  depends_on            = ["google_project_service.commentanalyzerapi", "google_pubsub_topic.stt_topic"]
  name                  = "perspective_api"
  region                = var.cloud_functions_region
  entry_point           = "main"
  runtime               = "python37"
  source_archive_bucket = google_storage_bucket.function_source_code.name
  source_archive_object = google_storage_bucket_object.perspective_code.name
  timeout               = "540"
  environment_variables = {
    output_bucket = google_storage_bucket.output_bucket.name
  }
  event_trigger {
    resource   = google_storage_bucket.transcription_bucket.name
    event_type = "google.storage.object.finalize"
  }
}

resource "google_cloudfunctions_function" "nlp_api" {
  depends_on            = ["google_project_service.nlpapi"]
  name                  = "nlp_api"
  region                = var.cloud_functions_region
  entry_point           = "main"
  runtime               = "python37"
  source_archive_bucket = google_storage_bucket.function_source_code.name
  source_archive_object = google_storage_bucket_object.nlp_code.name
  timeout               = "540"
  environment_variables = {
    output_bucket = google_storage_bucket.output_bucket.name
  }
  event_trigger {
    resource   = google_storage_bucket.transcription_bucket.name
    event_type = "google.storage.object.finalize"
  }
}

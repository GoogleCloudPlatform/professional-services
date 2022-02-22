# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


## Move required files to GCS before deploying App Engine
resource "google_storage_bucket_object" "app_engine_main" {
  name   = "webhook_endpoint/main.py"
  source = "../webhook_endpoint/main.py"
  bucket = google_storage_bucket.webhook_gcs_stage.name
}

resource "google_storage_bucket_object" "app_engine_consts" {
  name   = "webhook_endpoint/consts.py"
  source = "../webhook_endpoint/consts.py"
  bucket = google_storage_bucket.webhook_gcs_stage.name
}

resource "google_storage_bucket_object" "app_engine_exceptions" {
  name   = "webhook_endpoint/exceptions.py"
  source = "../webhook_endpoint/exceptions.py"
  bucket = google_storage_bucket.webhook_gcs_stage.name
}

resource "google_storage_bucket_object" "app_engine_pubsub_publisher" {
  name   = "webhook_endpoint/pubsub_publisher.py"
  source = "../webhook_endpoint/pubsub_publisher.py"
  bucket = google_storage_bucket.webhook_gcs_stage.name
}

resource "google_storage_bucket_object" "app_engine_app_yaml" {
  name   = "webhook_endpoint/app.yaml"
  source = "../webhook_endpoint/app.yaml"
  bucket = google_storage_bucket.webhook_gcs_stage.name
}

resource "google_storage_bucket_object" "app_engine_requirements" {
  name   = "webhook_endpoint/requirements.txt"
  source = "../webhook_endpoint/requirements.txt"
  bucket = google_storage_bucket.webhook_gcs_stage.name
}

## App Engine
resource "google_app_engine_application" "app" {
  project     = var.project_id
  location_id = var.webhook_app_region
}

## App Engine Service
resource "google_app_engine_standard_app_version" "webhook_app" {
  project    = var.project_id
  version_id = "v1"
  service    = "default"
  runtime    = "python37"

  entrypoint {
    shell = "gunicorn -b :8080 main:app"
  }
  instance_class = "F1"

  deployment {
    files {
      name       = "main.py"
      source_url = "https://storage.googleapis.com/${google_storage_bucket.webhook_gcs_stage.name}/webhook_endpoint/main.py"
    }
    files {
      name       = "consts.py"
      source_url = "https://storage.googleapis.com/${google_storage_bucket.webhook_gcs_stage.name}/webhook_endpoint/consts.py"
    }
    files {
      name       = "exceptions.py"
      source_url = "https://storage.googleapis.com/${google_storage_bucket.webhook_gcs_stage.name}/webhook_endpoint/exceptions.py"
    }
    files {
      name       = "pubsub_publisher.py"
      source_url = "https://storage.googleapis.com/${google_storage_bucket.webhook_gcs_stage.name}/webhook_endpoint/pubsub_publisher.py"
    }
    files {
      name       = "app.yaml"
      source_url = "https://storage.googleapis.com/${google_storage_bucket.webhook_gcs_stage.name}/webhook_endpoint/app.yaml"
    }
    files {
      name       = "requirements.txt"
      source_url = "https://storage.googleapis.com/${google_storage_bucket.webhook_gcs_stage.name}/webhook_endpoint/requirements.txt"
    }
  }

  env_variables = {
    TOPIC = var.pubsub_topic
  }

  delete_service_on_destroy = false
  noop_on_destroy           = true

  depends_on = [google_app_engine_application.app,
                google_storage_bucket_object.app_engine_main,
                google_storage_bucket_object.app_engine_consts,
                google_storage_bucket_object.app_engine_exceptions,
                google_storage_bucket_object.app_engine_pubsub_publisher,
                google_storage_bucket_object.app_engine_app_yaml,
                google_storage_bucket_object.app_engine_requirements]
}

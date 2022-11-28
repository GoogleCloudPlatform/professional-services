# Copyright 2022 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

resource "google_storage_bucket" "bucket-4-trigger-dag-cloud-fxn" {
  project = var.project_id
  name     = "trigger-dag-cloud-fxn"
  location = var.region
}

data "archive_file" "trigger-dag-archive" {
  type        = "zip"
  source_dir  = "../cloud-fxn-to-trigger-dag"
  output_path = "/tmp/function.zip"
}

# Add source code zip to the Cloud Function's bucket
resource "google_storage_bucket_object" "archive-trigger-dag" {
  source       = data.archive_file.trigger-dag-archive.output_path
  content_type = "application/zip"

  # Append to the MD5 checksum of the files's content
  # to force the zip to be updated as soon as a change occurs
  name   = "src-${data.archive_file.trigger-dag-archive.output_md5}.zip"
  bucket = google_storage_bucket.bucket-4-trigger-dag-cloud-fxn.name

  # Dependencies are automatically inferred so these lines can be deleted
  depends_on = [
    google_storage_bucket.bucket-4-trigger-dag-cloud-fxn,
    data.archive_file.trigger-dag-archive
  ]
}

resource "google_cloudfunctions2_function" "function-to-trigger-dag" {
  project = var.project_id
  name        = "trigger-dependency-for-airflow"
  description = "DAG dependency for airflow"
  location = var.region
  build_config {
      runtime     = "python39"
      entry_point = "trigger_dag_gcf"
      source {
        storage_source {
        bucket = google_storage_bucket.bucket-4-trigger-dag-cloud-fxn.name
        object = google_storage_bucket_object.archive-trigger-dag.name
        }
      }
  }
  service_config {
    max_instance_count = 50
    available_memory   = "512Mi"
    timeout_seconds = 120
    environment_variables = {
        DAG_DEPENDENCY_BUCKET = var.dag_dependency_bucket
        ENVIRONMENT = var.env
    }
  }
  event_trigger  {
    trigger_region = var.region
    event_type = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic = google_pubsub_topic.workflow_status_topic.id
    retry_policy = "RETRY_POLICY_RETRY"
  }
}
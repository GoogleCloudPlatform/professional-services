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

resource "google_storage_bucket_object" "dataflow_transform" {
  name   = "dataflow/transforms/transform.py"
  source = "../transforms/transform.py"
  bucket = google_storage_bucket.webhook_gcs_stage.name
}

## Enable Dataflow API
resource "google_project_service" "dataflow_api" {
  project = var.project_id
  service = "dataflow.googleapis.com"
  disable_on_destroy = false
}

# resource "google_dataflow_job" "dataflow_pipeline" {
#   project               = var.project_id
#   name                  = "${var.webhook_app}-${var.env}"
#   zone                  = var.webhook_zone
#   template_gcs_path     = var.dataflow_template
#   temp_gcs_location     = "${google_storage_bucket.webhook_gcs_stage.url}/dataflow/temp/"
#   service_account_email = google_service_account.webhook_sa.email
#   on_delete             = "drain"

#   parameters = {
#     project = var.project_id
#     outputProjectId = var.project_id
#     tempLocation = "${google_storage_bucket.webhook_gcs_stage.url}/dataflow/pipelines/temp/" # TODO is this required?
#     windowDuration = "2m"
#     subprocessTextTransformGcsPath = "${google_storage_bucket.webhook_gcs_stage.url}/${google_storage_bucket_object.dataflow_transform.output_name}"
#     subprocessRuntimeVersion = "python3"
#     subprocessTextTransformFunctionName = "transform"
#     inputTopic = "projects/${var.project_id}/topics/${var.pubsub_topic}"
#     outputDatasetTemplate = "${var.bigquery_dataset}"
#     outputTableNameTemplate = "${var.bigquery_table_template}"
#     outputDeadletterTable = "${var.dead_letter_queue}"
#   }

#   depends_on = [google_project_service.dataflow_api]
# }

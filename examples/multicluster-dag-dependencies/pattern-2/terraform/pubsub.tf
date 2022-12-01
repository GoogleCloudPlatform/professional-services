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

resource "google_pubsub_schema" "workflow_status" {
  project = var.project_id
  name = var.workflow_status_schema_name
  type = "AVRO"
  definition = file("${path.module}/workflow_schema.json")
}

resource "google_pubsub_topic" "workflow_status_topic" {
  name = var.workflow_status_topic
  project = var.project_id
  depends_on = [google_pubsub_schema.workflow_status]
  schema_settings {
    schema = google_pubsub_schema.workflow_status.id
    encoding = "JSON"
  }
}

resource "google_pubsub_topic_iam_member" "composer-sa-publisher" {
  project = google_pubsub_topic.workflow_status_topic.project
  topic = google_pubsub_topic.workflow_status_topic.name
  role = "roles/pubsub.publisher"
  for_each = toset(var.composer_service_account)
  member = "serviceAccount:${each.key}"
}

resource "google_pubsub_topic_iam_member" "composer-sa-subscriber" {
  project = google_pubsub_topic.workflow_status_topic.project
  topic = google_pubsub_topic.workflow_status_topic.name
  role = "roles/pubsub.subscriber"
  for_each = toset(var.composer_service_account)
  member = "serviceAccount:${each.key}"
}

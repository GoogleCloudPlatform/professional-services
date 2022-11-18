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
  for_each = toset(var.workflow_status_topics)
  name = each.key
  project = var.project_id
  depends_on = [google_pubsub_schema.workflow_status]
  schema_settings {
    schema = google_pubsub_schema.workflow_status.id
    encoding = "JSON"
  }
}

module "google_pubsub_subscription_4_composer_dag" {
  source          = "./modules/dag_subscription"
  project_id = var.project_id
  for_each = tomap(var.topics_subscriptions)
  topic = each.value.topic
  subscriptions = toset(each.value.subscription_for_dependencies)
  depends_on = [google_pubsub_topic.workflow_status_topic]
}

resource "google_pubsub_topic_iam_member" "composer-sa-publisher" {
  project = var.project_id
  for_each = toset(var.workflow_status_topics)
  topic = each.key
  role = "roles/pubsub.publisher"
  member = "serviceAccount:${var.composer_service_account}"
  depends_on = [google_pubsub_topic.workflow_status_topic]
}

resource "google_pubsub_topic_iam_member" "composer-sa-subscriber" {
  project = var.project_id
  for_each = toset(var.workflow_status_topics)
  topic = each.key
  role = "roles/pubsub.subscriber"
  member = "serviceAccount:${var.composer_service_account}"
  depends_on = [google_pubsub_topic.workflow_status_topic]
}
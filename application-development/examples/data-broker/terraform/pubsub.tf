/*
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
resource "google_pubsub_topic" "default_topic" {
  project = "${google_project.project.project_id}"
  name = "default-topic"
  depends_on = ["google_project_service.pubsub"]
}
output "pubsub topic" {
  value = "${google_pubsub_topic.default_topic.name}"
}

resource "google_pubsub_subscription" "default_topic_subscription" {
  name  = "default-topic-subscription"
  topic = "${google_pubsub_topic.default_topic.name}"
  project = "${google_project.project.project_id}"
}
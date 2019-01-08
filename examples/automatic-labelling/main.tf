# Copyright 2018 Google Inc.
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

# This Pub/Sub topic connects the Logging project sink to the Cloud Functions function.
resource "google_pubsub_topic" "resources_to_label" {
  name = "resources-to-label"
}

module "collect_log_entries" {
  source = "modules/collect_log_entries"

  pubsub_topic_id = "${google_pubsub_topic.resources_to_label.id}"
}

module "process_log_entries" {
  source = "modules/process_log_entries"

  pubsub_topic_name = "${google_pubsub_topic.resources_to_label.name}"
}

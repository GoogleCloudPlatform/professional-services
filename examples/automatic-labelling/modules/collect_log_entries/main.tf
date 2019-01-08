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

# This Logging project sink filters audit log events which describe insert (create) events and publishes them to the
# Pub/Sub topic.
resource "google_logging_project_sink" "identify_resources" {
  name        = "identify-resources"
  destination = "pubsub.googleapis.com/${var.pubsub_topic_id}"

  filter = "${
    join(
      " AND ",
      list(
        "protoPayload.@type=\"type.googleapis.com/google.cloud.audit.AuditLog\"",
        "protoPayload.methodName:insert",
        "operation.first=true",
      )
    )
  }"

  unique_writer_identity = true
}

# This Pub/Sub topic IAM member authorizes the writer identity (service account) of the Logging project sink to publish
# messages to the Pub/Sub topic.
resource "google_pubsub_topic_iam_member" "sink_writer_identity" {
  topic  = "${var.pubsub_topic_id}"
  member = "${google_logging_project_sink.identify_resources.writer_identity}"
  role   = "roles/pubsub.publisher"
}

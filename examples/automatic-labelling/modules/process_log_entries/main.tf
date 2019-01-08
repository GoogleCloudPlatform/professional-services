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

# This Cloud Functions function subscribes to the Pub/Sub topic and executes the label-resource program for each 
# message it receives.
# The label-resource program is obtained from the Storage bucket object.
resource "google_cloudfunctions_function" "label_resource" {
  name                  = "label-resource"
  source_archive_bucket = "${google_storage_bucket.label_resource.name}"
  source_archive_object = "${google_storage_bucket_object.label_resource_source.name}"

  description         = "Labels a resource with owner information."
  available_memory_mb = 128
  timeout             = 30
  entry_point         = "labelResource"

  event_trigger = {
    event_type = "providers/cloud.pubsub/eventTypes/topic.publish"
    resource   = "${var.pubsub_topic_name}"
  }
}

locals {
  label_resource = "${path.module}/label-resource"
}

resource "null_resource" "observe_label_resource_changes" {
  triggers = {
    index   = "${sha256(file("${local.label_resource}/index.js"))}"
    package = "${sha256(file("${local.label_resource}/package.json"))}"
  }

  provisioner "local-exec" {
    command = "zip --junk-paths --recurse-paths ${local.label_resource}.zip ${local.label_resource}"
  }
}

# This Storage bucket stores the Storage bucket object to make it available for the Cloud Functions function.
resource "google_storage_bucket" "label_resource" {
  name = "label-resource"
}

# This Storage bucket object places the label-resource archive in the Storage bucket.
resource "google_storage_bucket_object" "label_resource_source" {
  bucket = "${google_storage_bucket.label_resource.name}"
  name   = "label-resource.zip"
  source = "${local.label_resource}.zip"
}

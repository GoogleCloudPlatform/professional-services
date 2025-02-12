# Copyright 2022 Google LLC
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

// Provision storage bucket reserved for templates
resource "google_storage_bucket" "source" {
  location                    = "us"
  name                        = "${var.source_bucket_prefix}-${random_string.source_postfix.result}"
  uniform_bucket_level_access = true
  provisioner "local-exec" {
    // Enforce public access protection
    command = "gsutil pap set enforced gs://${google_storage_bucket.source.name}"
  }
}

// Generate a random string postfix so that the source bucket is unique
resource "random_string" "source_postfix" {
  special = false
  upper   = false
  length  = 8
}

// Query Google Cloud storage data for beam examples bucket
data "google_storage_bucket_object_content" "shakespeare" {
  bucket   = var.beam_examples_bucket
  for_each = toset(var.beam_examples_paths)
  name     = each.key
}

// Copy objects from beam examples bucket to project's internal source bucket
resource "google_storage_bucket_object" "source" {
  bucket       = google_storage_bucket.source.name
  for_each     = data.google_storage_bucket_object_content.shakespeare
  name         = each.value.name
  content      = each.value.content
  content_type = each.value.content_type
}
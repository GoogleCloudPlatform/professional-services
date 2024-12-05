/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

data "archive_file" "function_zip" {
  type        = "zip"
  output_path = "${path.module}/../bqclaude-remotefunction/target/bqclaude-remotefunction.zip"
  source_file = "${path.module}/../bqclaude-remotefunction/target/bqclaude-remotefunction-0.1.jar"
}

resource "google_storage_bucket" "cf_bucket" {
  name     = "${var.project}-gcf-source"
  location = "US"
  uniform_bucket_level_access = true
  project=var.project
  force_destroy = true
}

resource "google_storage_bucket_object" "cf_code" {
  name   = "function/bqclaude-remotefunction.zip"
  bucket = google_storage_bucket.cf_bucket.name
  source = data.archive_file.function_zip.output_path
}
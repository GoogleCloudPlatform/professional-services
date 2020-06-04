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


resource "google_storage_bucket" "webhook_gcs_stage" {
  project       = var.project_id
  name          = "${var.project_id}-${var.gcs_bucket_prefix}"
  location      = "US"
  force_destroy = true

  bucket_policy_only = true
  storage_class      = "STANDARD"

}

resource "google_storage_bucket_iam_member" "webhook_gcs_stage_members" {
  bucket = google_storage_bucket.webhook_gcs_stage.name
  role = "roles/storage.admin"
  member = "serviceAccount:${google_service_account.webhook_sa.email}"
}



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

resource "google_bigquery_dataset" "webhook_dataset" {
  project                     = var.project_id
  dataset_id                  = var.bigquery_dataset
  friendly_name               = var.bigquery_dataset
  description                 = "Webhook Application Destination Dataset"
  location                    = var.webhook_location

  labels = {
    env = "default"
  }

  access {
    role          = "roles/bigquery.dataOwner"
    user_by_email = google_service_account.webhook_sa.email
  }

  access {
    role          = "roles/bigquery.dataEditor"
    user_by_email = "${var.project_num}@cloudservices.gserviceaccount.com"
  }

  access {
    role          = "roles/bigquery.dataEditor"
    user_by_email = "${var.project_num}-compute@developer.gserviceaccount.com"
  }

  depends_on = [google_project_service.dataflow_api]
}

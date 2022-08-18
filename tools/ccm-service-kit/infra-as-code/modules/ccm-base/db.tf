# Copyright 2022 Google LLC All Rights Reserved.
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

resource "google_bigquery_dataset" "cloud_cost_staging" {
    project                     = var.project_id
    dataset_id                  = "cloud_cost_staging_ebf"
    friendly_name               = "Cloud Cost Staging ebf"
    #description                 = "This is a test description"
    location                    = var.bigquery.location
    #default_table_expiration_ms = 3600000

}
resource "google_bigquery_dataset_iam_member" "staging_dataset_members" {
    count       = length(var.bigquery.staging_dataset_iam_members)

    project     = var.project_id
    dataset_id  = google_bigquery_dataset.cloud_cost_staging.dataset_id
    role        = var.bigquery.staging_dataset_iam_members[count.index].role
    member      = var.bigquery.staging_dataset_iam_members[count.index].member
}

resource "google_bigquery_dataset" "cloud_cost_final" {
    project = var.project_id
    dataset_id                  = "cloud_cost_final_ebf"
    friendly_name               = "Cloud Cost Final_ebf"
    #description                 = "This is a test description"
    location                    = var.bigquery.location
    #default_table_expiration_ms = 3600000
}

resource "google_bigquery_dataset_iam_member" "final_dataset_members" {
    count       = length(var.bigquery.final_dataset_iam_members)

    project     = var.project_id
    dataset_id  = google_bigquery_dataset.cloud_cost_final.dataset_id
    role        = var.bigquery.final_dataset_iam_members[count.index].role
    member      = var.bigquery.final_dataset_iam_members[count.index].member
}
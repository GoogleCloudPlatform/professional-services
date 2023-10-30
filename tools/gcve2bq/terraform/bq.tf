/**
 * Copyright 2023 Google LLC
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

provider "google" {
  project = var.project
  region  = var.region
}

resource "google_bigquery_dataset" "default" {
  dataset_id                  = var.dataset-name
  friendly_name               = "GCVE Utilization"
  description                 = "Dataset to host data for GCVE utilization data"
  location                    = var.region
  default_table_expiration_ms = 3600000
}

resource "google_bigquery_table" "vm-table" {
  dataset_id = google_bigquery_dataset.default.dataset_id
  table_id   = var.vm-table-name
}

resource "google_bigquery_table" "datastore-table" {
  dataset_id = google_bigquery_dataset.default.dataset_id
  table_id   = var.datastore-table-name
}

resource "google_bigquery_table" "esxi-table" {
  dataset_id = google_bigquery_dataset.default.dataset_id
  table_id   = var.esxi-table-name
}

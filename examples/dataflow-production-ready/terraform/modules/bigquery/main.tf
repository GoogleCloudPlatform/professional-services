#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

# Set up BQ Dataset
resource "google_bigquery_dataset" "bq_demo_dataset" {
  project    = var.project
  dataset_id = var.dataset_name
  location   = var.dataset_location
}

resource "google_bigquery_table" "bq_demo_tables" {
  for_each   = fileset(var.bq_path_to_schemas, "*.json")
  project    = var.project
  dataset_id = google_bigquery_dataset.bq_demo_dataset.dataset_id
  table_id   = split(".", each.key)[0]
  schema     = file("${path.root}/${var.bq_path_to_schemas}/${each.key}")
}
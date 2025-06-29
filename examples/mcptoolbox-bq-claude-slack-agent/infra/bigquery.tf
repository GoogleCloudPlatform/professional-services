/**
 * Copyright 2025 Google LLC
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

resource "google_bigquery_dataset" "dataset" {
  dataset_id = local.bq_dataset
  location   = "US"
}

resource "google_bigquery_table" "hotels" {
  dataset_id          = google_bigquery_dataset.dataset.dataset_id
  table_id            = local.bq_table
  deletion_protection = false
  schema              = <<EOF
    [
        {
          "name": "id",
          "type": "INTEGER"
        },
        {
          "name": "name",
          "type": "STRING"
        },
        {
          "name": "location",
          "type": "STRING"
        },
        {
          "name": "price_tier",
          "type": "STRING"
        },
        {
          "name": "checkin_date",
          "type": "DATE"
        },
        {
          "name": "checkout_date",
          "type": "DATE"
        },
        {
          "name": "booked",
          "type": "BOOLEAN"
        }
    ]
EOF
}

locals {
  bigquery_data_location = "./bigquery/data.csv"
  bq_dataset             = "mcp_sources"
  bq_table               = "hotels"
}

resource "null_resource" "bq_load_data" {
  triggers = {
    csv_file_hash = filesha256(local.bigquery_data_location)
    project_id    = var.project_id
    dataset_id    = local.bq_dataset
    table_id      = local.bq_table
  }

  provisioner "local-exec" {
    command = <<EOT
      bq load \
        --project_id="${var.project_id}" \
        --source_format=CSV \
        --autodetect=false \
        "${var.project_id}:${local.bq_dataset}.${local.bq_table}" \
        "${local.bigquery_data_location}"
    EOT
  }

  depends_on = [google_bigquery_table.hotels]
}
/**
 * Copyright 2022 Google LLC
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

/*
 * This block is required to create a dataset
 * in bigquery which will house the table
 * created via dataflow for change streams to
 * bigquery
*/
resource "google_bigquery_dataset" "sc-dataset-tf" {
  dataset_id    = var.bigquery_dataset_name
  friendly_name = var.bigquery_dataset_name
  project       = var.project_id
  description   = "This is a dataset created for Spanner change stream to Bigquery POC using TF"
  location      = var.region

  labels = {
    env = "poc-tf"
  }

}

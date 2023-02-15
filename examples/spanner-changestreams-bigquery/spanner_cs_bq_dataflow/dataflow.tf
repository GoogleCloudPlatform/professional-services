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

resource "google_dataflow_flex_template_job" "spanner_changestream_bq" {
  provider                = google-beta
  name                    = var.dataflow_job_name
  container_spec_gcs_path = "gs://dataflow-templates/latest/flex/Spanner_Change_Streams_to_BigQuery"
  project                 = var.project_id
  region                  = var.region
  parameters = {
    spannerInstanceId         = google_spanner_instance.spanner-instance-data.name
    spannerDatabase           = google_spanner_database.spanner-database-data.name
    spannerMetadataInstanceId = google_spanner_instance.spanner-instance-metadata.name
    spannerMetadataDatabase   = google_spanner_database.spanner-database-metadata.name
    spannerChangeStreamName   = var.spanner_changestream_name
    bigQueryDataset           = google_bigquery_dataset.sc-dataset-tf.dataset_id
    #spannerProjectId =
    #spannerMetadataTableName =
    #rpcPriority =
    #startTimestamp =
    #endTimestamp =
    #bigQueryProjectId =
    #bigQueryChangelogTableNameTemplate =
    #deadLetterQueueDirectory =
    #deadLetterQueueRetryMinutes =
    #ignoreFields
  }
  on_delete = "cancel"
}

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

resource "google_service_account" "bqclaude_sa" {
    project = var.project
  account_id = "bqclaude-gcf-sa"
  display_name = "Service Account for Claude API cloud function"
}

resource "google_cloudfunctions2_function_iam_member" "invoker" {
  project        = var.project
  location       = var.region
  cloud_function = google_cloudfunctions2_function.function.name
  role           = "roles/cloudfunctions.invoker"
  member         = "serviceAccount:${google_service_account.bqclaude_sa.email}"
}

resource "google_cloud_run_service_iam_member" "cloud_run_invoker" {
  project  = var.project
  location = var.region
  service  = google_cloudfunctions2_function.function.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.bqclaude_sa.email}"
}

resource "google_cloudfunctions2_function_iam_member" "bq_conn_sa_cf" {
  project        = var.project
  location       = var.region
  cloud_function = google_cloudfunctions2_function.function.name
  role           = "roles/cloudfunctions.invoker"
  member         = "serviceAccount:${google_bigquery_connection.remote_function.cloud_resource[0].service_account_id}"
}

resource "google_cloud_run_service_iam_member" "bq_conn_sa_cloud_run_invoker" {
  project  = var.project
  location = var.region
  service  = google_cloudfunctions2_function.function.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_bigquery_connection.remote_function.cloud_resource[0].service_account_id}"
}

resource "google_project_iam_member" "bqclaude_sa_secrets" {
  project = var.project
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.bqclaude_sa.email}"
}
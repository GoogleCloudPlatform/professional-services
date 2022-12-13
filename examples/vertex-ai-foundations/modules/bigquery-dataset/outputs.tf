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

output "dataset" {
  description = "Dataset resource."
  value       = google_bigquery_dataset.default
}

output "dataset_id" {
  description = "Dataset id."
  value       = google_bigquery_dataset.default.dataset_id
  depends_on = [
    google_bigquery_dataset_access.domain,
    google_bigquery_dataset_access.group_by_email,
    google_bigquery_dataset_access.special_group,
    google_bigquery_dataset_access.user_by_email,
    google_bigquery_dataset_access.views
  ]
}

output "id" {
  description = "Fully qualified dataset id."
  value       = google_bigquery_dataset.default.id
  depends_on = [
    google_bigquery_dataset_access.domain,
    google_bigquery_dataset_access.group_by_email,
    google_bigquery_dataset_access.special_group,
    google_bigquery_dataset_access.user_by_email,
    google_bigquery_dataset_access.views
  ]
}

output "self_link" {
  description = "Dataset self link."
  value       = google_bigquery_dataset.default.self_link
  depends_on = [
    google_bigquery_dataset_access.domain,
    google_bigquery_dataset_access.group_by_email,
    google_bigquery_dataset_access.special_group,
    google_bigquery_dataset_access.user_by_email,
    google_bigquery_dataset_access.views
  ]
}

output "table_ids" {
  description = "Map of fully qualified table ids keyed by table ids."
  value       = { for k, v in google_bigquery_table.default : v.table_id => v.id }
}

output "tables" {
  description = "Table resources."
  value       = google_bigquery_table.default
}

output "view_ids" {
  description = "Map of fully qualified view ids keyed by view ids."
  value       = { for k, v in google_bigquery_table.views : v.table_id => v.id }
}

output "views" {
  description = "View resources."
  value       = google_bigquery_table.views
}

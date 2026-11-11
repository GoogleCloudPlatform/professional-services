# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

output "team_service_accounts" {
  description = "Service account email per team. Each team's application runs as, or impersonates, its account."
  value       = { for team, sa in google_service_account.team : team => sa.email }
}

output "usage_table" {
  description = "BigQuery table the sink creates after the first request: one row per Gemini request."
  value       = "${var.project_id}.${google_bigquery_dataset.usage.dataset_id}.aiplatform_googleapis_com_inference_request"
}

output "sink_writer_identity" {
  description = "Identity the log sink uses to write to BigQuery."
  value       = google_logging_project_sink.usage.writer_identity
}

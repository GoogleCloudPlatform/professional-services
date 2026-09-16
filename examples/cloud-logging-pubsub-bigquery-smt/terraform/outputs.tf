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

output "bigquery_dataset_id" {
  description = "The ID of the BigQuery dataset created for Cloud Logging analytics."
  value       = google_bigquery_dataset.cloud_logging.dataset_id
}

output "bigquery_table_id" {
  description = "The full table reference (project.dataset.table) of the unified Cloud Logging BigQuery table."
  value       = "${var.project_id}.${google_bigquery_dataset.cloud_logging.dataset_id}.${google_bigquery_table.unified_cloud_logs.table_id}"
}

output "ingestion_topic_name" {
  description = "Name of the Pub/Sub topic receiving exported Cloud Logging entries."
  value       = google_pubsub_topic.ingestion.name
}

output "dlq_topic_name" {
  description = "Name of the Dead-Letter Queue (DLQ) Pub/Sub topic for failed log entries."
  value       = google_pubsub_topic.dlq.name
}

output "dlq_subscription_name" {
  description = "Name of the pull subscription attached to the DLQ topic for CLI inspection and replay."
  value       = google_pubsub_subscription.dlq_sub.name
}

output "bq_subscription_name" {
  description = "Name of the Pub/Sub BigQuery subscription executing the inline SMT JavaScript UDF."
  value       = google_pubsub_subscription.bq_sub.name
}

output "log_sink_writer_identity" {
  description = "Service account identity of the Cloud Logging sink granted Pub/Sub publisher permissions."
  value       = google_logging_project_sink.pubsub_sink.writer_identity
}

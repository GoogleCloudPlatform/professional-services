# Copyright 2020 Google Inc.
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

variable "project_id" {
  description = "Project ID for your GCP project"
}
variable "location" {
  description = "Location for GCP resources"
  default     = "US"
}

variable "region" {
  description = "Region for GCP resources"
  default     = "us-central1"
}

variable "service_acct_name" {
  description = "The service account used by the three BQ email export Cloud Functions"
}

variable "service_acct_roles" {
  description = "Roles for the Cloud Function service account"
  default     = ["roles/bigquery.admin", "roles/storage.admin", "roles/iam.serviceAccountTokenCreator"]
}

variable "topic_name_1" {
  description = "Name for the Pub/Sub topic that is triggered by Cloud Scheduler."
  default     = "bq-email-run-query"
}

variable "topic_name_2" {
  description = "Name for the Pub/Sub topic that subscribes to the audit log sink for completed queries."
  default     = "bq-email-export-gcs"
}

variable "topic_name_3" {
  description = "Name for the Pub/Sub topic that subscribes to the audit log sink for exported queries."
  default     = "bq-email-send-email"
}

variable "query_logging_sink_name" {
  description = "Name for the logging sink that triggers Pub/Sub topic 2 when query is completed."
  default     = "bq-email-query-completed"
}

variable "export_logging_sink_name" {
  description = "Name for the logging sink that triggers Pub/Sub topic 3 when export to GCS is completed."
  default     = "bq-email-export-completed"
}

variable "sendgrid_api_key" {
  description = "API key for authenticating the sending of emails through SendGrid API"
}

variable "storage_bucket" {
  description = "Name of GCS bucket to store exported query results from BQ."
}

variable "bucket_lifecycle" {
  description = "Number of days the exported query result files should stay in the storage bucket."
  default     = 1
}

variable "function_bucket_1" {
  description = "GCS bucket for function 1 code that runs query."
}

variable "function_bucket_2" {
  description = "GCS bucket for function 2 code that exports query results."
}

variable "function_bucket_3" {
  description = "GCS bucket for function 3 code that sends email."
}

variable "run_query_function_name" {
  description = "Name for the Cloud Function that runs query."
  default     = "bq-email-run-query"
}

variable "export_results_function_name" {
  description = "Name for the Cloud Function that exports query results."
  default     = "bq-email-export-gcs"
}

variable "email_results_function_name" {
  description = "Name for the Cloud Function that sends email."
  default     = "bq-email-send-email"
}

variable "scheduler_name" {
  description = "Name for Cloud Scheduler job."
}
variable "scheduler_schedule" {
  description = "Cron-style schedule for Scheduler job."
}

variable "scheduler_timezone" {
  description = "Time zone for Cloud Scheduler."
  default     = "US/Central"
}

# Environment variables for the Cloud Functions
variable "gcs_query_path" {
  description = "Path to GCS file with query."
}

variable "allow_large_results" {
  description = "Allow large query results tables"
  default     = "True"
}

variable "use_query_cache" {
  description = "Look for the query result in the cache."
  default     = "True"
}

variable "flatten_results" {
  description = "Flatten nested/repeated fields in query results."
  default     = "False"
}

variable "max_bytes_billed" {
  description = "Maximum bytes to be billed for query job."
  default     = 1000000000
}

variable "use_legacy_sql" {
  description = "Use legacy SQL syntax for query."
  default     = "False"
}

variable "export_object_name" {
  description = "GCS object name for query results file"
}

variable "export_compression" {
  description = "Compression type to use for exported files."
  default     = "NONE"
}

variable "export_destination_format" {
  description = "Exported file format."
  default     = "NEWLINE_DELIMETED_JSON"
}

variable "export_use_avro_logical_types" {
  description = "For loads of Avro data, governs whether Avro logical types are converted to their corresponding BigQuery types."
  default     = "False"
}

variable "export_field_delimiter" {
  description = "Delimiter to use between fields in the exported data."
  default     = ","
}

variable "signed_url_expiration_hrs" {
  description = "Number of hours until the signed URL sent via email will expire."
  default     = 24
}

variable "sender_email_address" {
  description = "Email address of sender."
}

variable "recipient_email_address" {
  description = "Email address of recipient."
}

variable "email_subject" {
  description = "Subject of email address containing query results."
}
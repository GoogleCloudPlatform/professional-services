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

variable "pubsub_export" {
  description = "Name for the Pub/Sub topic that is triggered on scheduled query completion."
  default     = "bq-email-gcs-export"
}

variable "pubsub_send_email" {
  description = "Name for the Pub/Sub topic that is triggered on successful export to GCS."
  default     = "bq-email-send-email"
}

variable "bq_dataset_name" {
  description = "Name for BQ dataset where the scheduled query results will be saved."
}

variable "bq_dataset_expiration" {
  description = "The default lifetime of all tables in the dataset in milliseconds. The minimum value is 3600000 ms, or one hour."
  default     = "3600000"
}

variable "bq_table_name" {
  description = "Name for BQ table where the scheduled query results will be saved."
}

variable "scheduled_query_name" {
  description = "Display name for BQ scheduled query"
  default     = "bq-email-exports"
}

variable "schedule" {
  description = "Scheduled query schedule. Examples of valid format: 1st,3rd monday of month 15:30, every wed jan, every 15 minutes."
}

variable "query" {
  description = "Query that will run in BQ. The results will be sent via email."
}

variable "export_logging_sink_name" {
  description = "Name for the logging sink that triggers Pub/Sub topic 3 when export to GCS is completed."
  default     = "bq-email-export-completed"
}

variable "storage_bucket" {
  description = "Name of GCS bucket to store exported query results from BQ."
}

variable "bucket_lifecycle" {
  description = "Number of days the exported query result files should stay in the storage bucket."
  default     = 1
}

variable "function_bucket_1" {
  description = "GCS bucket name for function 1 code that runs query."
}

variable "function_bucket_2" {
  description = "GCS bucket name for function 2 code that exports query results."
}

variable "export_results_function_name" {
  description = "Name for the Cloud Function that exports query results."
  default     = "bq-email-export-gcs"
}

variable "email_results_function_name" {
  description = "Name for the Cloud Function that sends email."
  default     = "bq-email-send-email"
}

# Environment variables for the Cloud Functions
variable "export_object_name" {
  description = "GCS object name with JSON, CSV, or AVRO file extension for query results file"
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

variable "sendgrid_api_key" {
  description = "API key for authenticating the sending of emails through SendGrid API"
}

variable "enable_signed_url" {
  description = "Boolean indicating whether the link sent via email should be a signed URL or unsigned URL requiring cookie-based authentication"
  default     = "True"
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
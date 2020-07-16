# Copyright 2019 Google Inc.
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
  description = "The service account used by the BQ email export Cloud Function"
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
  description = "GCS bucket to store exported query results from BQ."
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

variable "function_name_1" {
  description = "Name for the Cloud Function that runs query."
  default     = "bq-email-run-query"
}

variable "function_name_2" {
  description = "Name for the Cloud Function that exports query results."
  default     = "bq-email-export-gcs"
}

variable "function_name_3" {
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
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
}

variable "service_acct_name" {
  description = "The service account used by the BQ email export Cloud Function"
}
variable "function_name" {
  description = "Name for the Cloud Function"
}

variable "topic_name" {
  description = "Name for the Pub/Sub topic that the Cloud Function will subscribe to"
}
variable "sendgrid_api_key" {
  description = "API key for authenticating the sending of emails through SendGrid API"
}

variable "bq_dataset" {
  description = "Dataset name where BQ queries will run."
}

variable "storage_bucket" {
  description = "Storage bucket for exported JSON files."
}

variable "bucket_lifecycle" {
  description = "Number of days the exported JSON query result files should stay in the storage bucket. "
}

variable "function_bucket" {
  description = "Bucket for function code."
}

variable "scheduler_name" {
  description = "Name for Cloud Scheduler job."
}
variable "scheduler_schedule" {
  description = "Cron-style schedule for Scheduler job."
}

variable "scheduler_timezone" {
  description = "Time zone for Cloud Scheduler."
}






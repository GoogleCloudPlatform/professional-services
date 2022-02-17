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

### Project Config ###
variable "project_id" {
  description = "Project ID for your GCP project"
}

variable "project_num" {
  description = "Project num for your GCP Project"
}

### Location Config ###
variable "webhook_location" {
  description = "Location for your environment"
  default     = "US"
}

variable "webhook_app_region" {
  description = "App Engine Region for your environment"
  default     = "us-central"
}

variable "webhook_region" {
  description = "Region for your environment"
  default     = "us-central1"
}

variable "webhook_zone" {
  description = "Zone for your environment"
  default     = "us-central1-b"
}

### GCS Config ###
variable "gcs_bucket_prefix" {
  description = "Storage Bucket Prefix used for file and temporary storage"
  default     = "webhook-storage"
}

### App Engine Config ###
variable "webhook_app" {
  description = "Webhook App Engine Service Name"
  default     = "webhook-app"
}

### Pub/Sub Config ###
variable "pubsub_topic" {
  description = "Pub/Sub Topic to Buffer App Engine to Dataflow Data"
  default     = "webhook_topic"
}
variable "pubsub_subscription" {
  description = "Pub/Sub Subscription to be used by Dataflow"
  default     = "dataflow-subscription"
}

### BigQuery Config ###
variable "bigquery_dataset" {
  description = "BigQuery Dataset destination for pipeline"
  default     = "webhook"
}

variable "bigquery_table_template" {
  description = "BigQuery Table destination template for pipeline"
  default     = "webhook_table"
}

variable "dead_letter_queue" {
  description = "BigQuery Dead Letter Queue table"
}

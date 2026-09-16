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

variable "project_id" {
  description = "Google Cloud Project ID where the Cloud Logging to BigQuery pipeline resources will be deployed."
  type        = string
}

variable "region" {
  description = "Google Cloud region for BigQuery dataset location and regional resources."
  type        = string
  default     = "us-central1"
}

variable "dataset_id" {
  description = "BigQuery dataset ID for storing unified Cloud Logging records."
  type        = string
  default     = "cloud_logging"
}

variable "table_id" {
  description = "BigQuery table ID for partitioned and clustered Cloud Logging records."
  type        = string
  default     = "unified_cloud_logs"
}

variable "log_filter" {
  description = "Cloud Logging inclusion filter expression for routing logs to the Pub/Sub ingestion sink."
  type        = string
  default     = "severity >= INFO"
}

variable "enable_log_exclusion" {
  description = "Whether to enable a Cloud Logging exclusion filter on the _Default log bucket to prevent duplicate ingestion charges ($0.50/GB savings)."
  type        = bool
  default     = false
}

variable "exclusion_filter" {
  description = "Cloud Logging filter expression for excluding routed logs from the _Default log bucket."
  type        = string
  default     = "severity >= INFO AND resource.type = \"gce_instance\""
}

variable "notification_channels" {
  description = "List of Cloud Monitoring notification channel IDs to attach to DLQ and UDF latency alert policies."
  type        = list(string)
  default     = []
}

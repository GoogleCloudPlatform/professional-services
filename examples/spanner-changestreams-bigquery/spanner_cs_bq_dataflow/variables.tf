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

variable "region" {
  description = "Google Cloud region"
  type        = string
  default     = "australia-southeast2"
}

variable "project_id" {
  description = "Google Project ID."
  type        = string
}

variable "spanner_instance_name_for_userdata" {
  description = "Spanner Instance Name for storing user data."
  type        = string
}

variable "spanner_database_name_for_userdata" {
  description = "Spanner Database Name for storing user data."
  type        = string
}

variable "spanner_instance_name_for_metadata" {
  description = "Spanner Instance Name for storing metadata."
  type        = string
}

variable "spanner_database_name_for_metadata" {
  description = "Spanner Database Name for storing metadata."
  type        = string
}

variable "bigquery_dataset_name" {
  description = "BigQuery Dataset Name for change stream table."
  type        = string
}

variable "dataflow_job_name" {
  description = "Dataflow Streaming Job Name for change streams from Spanner to BigQuery"
  type        = string
}

variable "spanner_changestream_name" {
  description = "Name of Changestream created in Spanner"
  type        = string
}



# Copyright 2019 Google LLC
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


# Variables
variable "project_id" {
  description = "The ID of the project in which to provision resources"
  type        = string
}

variable "region" {
  description = "The region in which to provision resources"
  type        = string
  default     = "us-central1"
}

variable "bigquery_dataset_id" {
  description = "The ID of the existing BigQuery dataset"
  type        = string
}

variable "bigquery_table_id" {
  description = "The ID of the existing BigQuery table"
  type        = string
}

variable "bigtable_min_node_count" {
  description = "The minimum number of nodes for BigTable autoscaling. Must be >= 1"
  type        = number
  default     = 1
  validation {
    condition     = var.bigtable_min_node_count >= 1
    error_message = "min_node_count must be greater than or equal to 1"
  }
}

variable "bigtable_max_node_count" {
  description = "The maximum number of nodes for BigTable autoscaling. Must be >= min_node_count and <= 10 * min_node_count"
  type        = number
  default     = 5
}

variable "bigtable_cpu_utilization_target" {
  description = "Target CPU utilization percentage for BigTable autoscaling (10-80)"
  type        = number
  default     = 50
  validation {
    condition     = var.bigtable_cpu_utilization_target >= 10 && var.bigtable_cpu_utilization_target <= 80
    error_message = "cpu_utilization_target must be between 10 and 80"
  }
}

variable "crowding_column" {
  description = "Optional column for crowding attribute"
  type        = string
  default     = null
}

variable "distance_measure_type" {
  description = "The distance measure used in nearest neighbor search"
  type        = string
  default     = "DOT_PRODUCT_DISTANCE"
  validation {
    condition     = contains(["SQUARED_L2_DISTANCE", "COSINE_DISTANCE", "DOT_PRODUCT_DISTANCE"], var.distance_measure_type)
    error_message = "distance_measure_type must be one of: SQUARED_L2_DISTANCE, COSINE_DISTANCE, DOT_PRODUCT_DISTANCE"
  }
}

variable "embedding_column" {
  description = "Name of the column containing embeddings"
  type        = string
  default     = null
}

variable "embedding_dimension" {
  description = "The number of dimensions of the input embedding"
  type        = number
  default     = 512
  validation {
    condition     = var.embedding_dimension > 0
    error_message = "Embedding dimension must be positive"
  }
}

variable "enable_dedicated_serving_endpoint" {
  description = "Whether to enable dedicated serving endpoint. If false, will use default endpoint."
  type        = bool
  default     = false
}

variable "enable_private_service_connect" {
  description = "Whether to enable private service connect for dedicated endpoint. Only applies if dedicated endpoint is enabled."
  type        = bool
  default     = false
}

variable "entity_id_columns" {
  description = "List of columns to use as entity IDs"
  type        = list(string)
}

variable "feature_store_name" {
  description = "Name of the feature store"
  type        = string
  validation {
    condition     = length(var.feature_store_name) <= 60
    error_message = "Feature store name must be 60 characters or less"
  }
}

variable "feature_view_id" {
  description = "ID for the feature view"
  type        = string
  default     = "feature_view_publications"
}

variable "filter_columns" {
  description = "Optional columns to filter vector search results"
  type        = list(string)
  default     = null
}

variable "project_allowlist" {
  description = "List of project numbers allowed for private service connect. Only used if private service connect is enabled."
  type        = list(string)
  default     = []
}

variable "storage_type" {
  description = "Storage type for the feature store. Must be either 'optimized' or 'bigtable'"
  type        = string
  default     = "optimized"
  validation {
    condition     = contains(["optimized", "bigtable"], var.storage_type)
    error_message = "storage_type must be either 'optimized' or 'bigtable'"
  }
}

variable "sync_schedule" {
  description = "Cron schedule for syncing data. Format: 'TZ=<timezone> * * * * *'"
  type        = string
  default     = "0 0 * * *" # Daily at midnight if not specified
}
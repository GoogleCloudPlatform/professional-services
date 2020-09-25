/**
 * Copyright 2020 Google LLC. 
 *
 * This software is provided as-is, 
 * without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google. 
 */

variable "default_table_expiration_ms" {
  description = "Default TTL of tables using the dataset in MS."
  default     = null
}

variable "project_id" {
  description = "Project where the dataset and table are created."
}

variable "dataset_labels" {
  description = "A mapping of labels to assign to the dataset."
  type        = map(string)
}

variable "tables" {
  description = "A list of maps that includes table_id, schema, clustering, time_partitioning, expiration_time, labels in each element."
  default     = []
  type = list(object({
    table_id   = string,
    schema     = string,
    clustering = list(string),
    time_partitioning = object({
      expiration_ms            = string,
      field                    = string,
      type                     = string,
      require_partition_filter = bool,
    }),
    expiration_time = string,
    labels          = map(string),
  }))
}

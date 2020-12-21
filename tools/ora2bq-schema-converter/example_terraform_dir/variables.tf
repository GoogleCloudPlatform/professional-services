# Copyright 2020 Google LLC.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#     http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# Authors: yunusd@google.com, sametkaradag@google.com

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

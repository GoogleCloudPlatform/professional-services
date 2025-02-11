# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

variable "project" {}

variable "region" {
  default = "us-central1"
}

variable "buckets_to_monitor" {
  type = list
  default = []
  description = "List of bucket names that will trigger the dataflow job when a new object is added."
}

variable "dataflow_bucket" {
  type    = string
  default = ""
}

variable "secret_name" {
  type        = string
  default     = "hash-key-64"
  description = "Secret name where base64 encoded hash key exists"
}

variable "firestore_collection" {
  type        = string
  default     = "hashed_socials"
  description = "The name of the Firestore collection where the hashed SSNs are"
}

variable "input_topic" {
  type        = string
  default     = "hashpipeline-input"
  description = "The Pubsub topic that the input GCS filename is written to"
}

variable "output_topic" {
  type        = string
  default     = "hashpipeline-output"
  description = "The Pubsub topic that the output count of SSNs is written to"
}

variable "salt_byte_length" {
  type        = string
  default     = 16
  description = "Byte length of the salt value prepended to the SSN before hashing"
}

variable "df_worker_project_permissions" {
  type = list
  default = [
    "roles/dataflow.worker",
    "roles/datastore.viewer",
    "roles/dlp.user",
  ]
}

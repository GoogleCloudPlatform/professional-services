#!/bin/bash
# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

variable "project_id" {
  description = "The project to deploy in."
  type        = string
}

variable "reddit_client_id" {
  description = "Reddit app client ID. found here:  "
  type    = string
}

variable "reddit_client_secret" {
  description = "Reddit app client secret. found here:  "
  type    = string
}
  
variable "reddit_username" {
  description = "Reddit app username. found here:  "
  type    = string
}

variable "reddit_password" {
  description = "Reddit app password. found here:  "
  type    = string
}

variable "app_bucket" {
  description = "GCS bucket for this app."
  type    = string
}

variable "service_account_name" {
  description = "display name for reddit vm service account"
  type    = string
}


variable "pubsub_topic_name" {
  description = "Pub Sub Topic to receive comments from the reddit VM"
  type    = string
}

variable "bq_dataset_name" {
    description = "bigquery dataset name"
    type    = string
}

variable "bq_table_name" {
    description = "bigquery dataset name"
    type    = string
}

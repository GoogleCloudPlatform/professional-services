# Copyright 2022 Google LLC All Rights Reserved.
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
  description = "Project ID where all this will be steup."
  type        = string
}

variable "region" {
  description = "Region where all this will be steup."
  type        = string
}


variable "zone" {
  description = "Zone where all this will be steup."
  type        = string
}

variable "bigquery_location" {
  description = "Location of CCM Bigquery Dataset"
  type        = string
}

variable "ccm-trigger-pubsub-topic" {
  description = "PubSub topic used to trigger composer build"
  type        = string
}

variable "ccm-delete-pubsub-topic" {
  description = "PubSub topic used to delete the composer build"
  type        = string
}

variable "ccm-scheduler-trigger-name" {
  description = "Scheduler name for Composer trigger"
  type        = string
}

variable "ccm-scheduler-trigger-frecuency" {
  description = "Scheduler cron expresion"
  type        = string
}

variable "project_number" {
  description = "Project Numer"
  type = string
}
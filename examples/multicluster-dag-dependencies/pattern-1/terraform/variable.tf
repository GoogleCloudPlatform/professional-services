# Copyright 2022 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

variable "project_id" {
  description = "The project ID"
  type        = string
}

variable "workflow_status_topics" {
  description = "Name of workflow status topic"
  type = list(string)
}

variable "topics_subscriptions" {
  description = "Subscriptions of the dependent DAGs"
  type = any
}

variable "composer_service_account"{
  description = "Service account of composer"
  type        = string
}

variable "workflow_status_schema_name" {
  description = "Name of workflow status"
  type        = string
}
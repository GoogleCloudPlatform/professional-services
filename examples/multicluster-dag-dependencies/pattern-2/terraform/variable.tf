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

variable "workflow_status_topic" {
  description = "Name of workflow status topic"
  type = string
}

variable "workflow_status_schema_name" {
  description = "Name of the schema"
  type=string
}

variable "env" {
  description = "Environment (Dev, QA, Prod)"
  type=string
}

variable "trigger_topic"{
    description = "Pub/Sub topic name  in the format projects/project-id/topics/topic-name"
    type=string
}

variable "region" {
  type=string
}

variable "composer_service_account"{
  description = "Service account of composer"
  type        = list(string)
}

variable "cloud_function_serivce_account" {
  description = "Service account used by cloud function"
  type = string
}

variable "dag_dependency_bucket"{
  description = "Bucket name where dag-dependencies are stored"
  type = string
}
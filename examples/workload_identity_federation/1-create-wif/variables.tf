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


variable "project_id" {
  type        = string
  description = "The GCP Project ID that will be used to host the Workload Identity Federation."
}

variable "gitlab_url" {
  type    = string
  default = "https://gitlab.com"
}

variable "gitlab_project" {
  type        = string
  description = "The Gitlab Project ID that will be used for running the pipelines."
}

variable "gitlab_service_account" {
  type        = string
  description = "Name for the service account that will be associated to the workload identity providers"
}
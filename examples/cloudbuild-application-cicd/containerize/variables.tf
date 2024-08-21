# Copyright 2023 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

variable "cicd_project_id" {
  description = "The name of the CICD GCP Project to deply the Cloud Build Triggers to."
  type        = string
}

variable "region" {
  description = "The root region to deploy the Cloud Build Triggers to."
  type        = string
}

variable "cicd_ar_docker_name" {
  description = "CICD Project Artifact Registry Docker Repo Name."
  type        = string
  default     = "docker"
}

variable "cicd_ar_docker_loc" {
  description = "CICD Project Artifact Registry Docker Repo Location."
  type        = string
  default     = "us-central1"
}

variable "application_name" {
  description = "The name of the application to containerize."
  type        = string
}

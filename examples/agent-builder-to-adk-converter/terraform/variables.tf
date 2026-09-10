# Copyright 2026 Google LLC
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
  description = "The Google Cloud Project ID where all resources will be provisioned."
  type        = string
}

variable "region" {
  description = "The Google Cloud region for Cloud Run and Artifact Registry."
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "The name of the Cloud Run v2 service."
  type        = string
  default     = "agent-builder-to-adk-converter"
}

variable "repository_name" {
  description = "The name of the Artifact Registry repository for container images."
  type        = string
  default     = "agent-builder-to-adk-repo"
}

variable "container_image" {
  description = "The container image URI to deploy to Cloud Run (e.g. us-central1-docker.pkg.dev/PROJECT/REPO/IMAGE:TAG)."
  type        = string
}

variable "environment" {
  description = "Deployment environment identifier (e.g. development, staging, production)."
  type        = string
  default     = "production"
}

variable "allow_unauthenticated" {
  description = "Whether to allow unauthenticated invocations to Cloud Run. Defaults to false for enterprise least privilege."
  type        = bool
  default     = false
}

variable "cpu_limit" {
  description = "vCPU allocation for the Cloud Run instance container."
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "Memory allocation for the Cloud Run instance container."
  type        = string
  default     = "512Mi"
}

variable "min_instances" {
  description = "Minimum instance count for Cloud Run service autoscaling."
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum instance count for Cloud Run service autoscaling."
  type        = number
  default     = 10
}

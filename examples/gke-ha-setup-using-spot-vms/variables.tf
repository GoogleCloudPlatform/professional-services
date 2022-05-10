/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

variable "project_id" {
  type        = string
  description = "GCP project ID of project to deploy this sample into"
}

variable "zone" {
  type        = string
  description = "GCP zone in which to deploy the GKE cluster"
  default     = "europe-west1-b"
}
variable "drain_job_name" {
  type        = string
  description = "Name for the drain job, this also affects the K8S namespace"
  default     = "drain-job"
}

variable "app_name" {
  type        = string
  description = "Name for the sample container, this also affects the K8S namespace"
  default     = "my-app"
}

variable "machine_type" {
  type        = string
  description = "Machine type to use for nodes within the GKE node pools"
  default     = "e2-medium"
}
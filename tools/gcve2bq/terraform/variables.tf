/**
 * Copyright 2023 Google LLC
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

variable "project" {
  type        = string
  default     = ""
  description = "Google Cloud Project ID"
}

variable "region" {
  type        = string
  default     = ""
  description = "Google Cloud Region for your resources"
}

variable "cloudrun-job-name" {
  type        = string
  default     = ""
  description = "Name of the Cloud Run job which will execute the export."
}

variable "cloudrun-image" {
  type        = string
  default     = ""
  description = "URL of the Container image in Google Container Registry or Google Artifact Registry."
}

variable "dataset-name" {
  type        = string
  default     = ""
  description = "Name of the BigQuery dataset to store all GCVE Utilization tables"
}

variable "repository-name" {
  type        = string
  default     = ""
  description = "Name of the repository in artifact registry."
}

variable "vm-table-name" {
  type        = string
  default     = ""
  description = "Name of the table which will store all VM utilization information."
}

variable "datastore-table-name" {
  type        = string
  default     = ""
  description = "Name of the table which will store all datastore utilization information."
}

variable "esxi-table-name" {
  type        = string
  default     = ""
  description = "Name of the table which will store all ESXi utilization information."
}

variable "serverless-vpc-connector-name" {
  type        = string
  default     = ""
  description = "Name of the Serverless VPC Connector."
}

variable "vCenter-username" {
  type        = string
  default     = ""
  description = "Name of the user account which will access vCenter."
}

variable "vCenter-server" {
  type        = string
  default     = ""
  description = "FQDN of the vCenter server."
}

variable "vCenter-password-secret" {
  type        = string
  default     = ""
  description = "FQDN of the vCenter server."
}

variable "cloudrun-service-account-name" {
  type        = string
  default     = ""
  description = "Cloud Run Service Account name"
}

variable "scheduler-service-account-name" {
  type        = string
  default     = ""
  description = "Name of the service account which will invoke the Cloud Run job."
}

variable "scheduler-job-name" {
  type        = string
  default     = ""
  description = "Name of the Cloud Scheduler job"
}

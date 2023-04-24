/**
 * Copyright 2022 Google LLC
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

variable "billing_account" {
  description = "The ID of the billing account to associate this project with"
}

variable "cf_version" {
  description = "Cloud Function version 2nd Gen or 1st Gen. Possible options: 'V1' or 'V2'.Use CFv2 if your Cloud Function timeouts after 9 minutes. By default it is using CFv1."
  default     = "V1"
  validation {
    condition     = var.cf_version == "V1" || var.cf_version == "V2"
    error_message = "The value of cf_version must be either V1 or V2."
  }
}

variable "monitored_folders_list" {
  type        = list(string)
  description = "ID of the projects to be monitored (where limits and quotas data will be pulled)"
  default     = []
}

variable "monitored_projects_list" {
  type        = list(string)
  description = "ID of the projects to be monitored (where limits and quotas data will be pulled)"
}

variable "monitoring_project_id" {
  description = "Monitoring project where the dashboard will be created and the solution deployed; a project will be created if set to empty string"
  default     = ""
}


variable "organization_id" {
  description = "The organization id for the associated services"
}

variable "prefix" {
  description = "Customer name to use as prefix for monitoring project"
}

variable "project_monitoring_services" {
  description = "Service APIs enabled in the monitoring project if it will be created."
  default = [
    "artifactregistry.googleapis.com",
    "cloudasset.googleapis.com",
    "cloudbilling.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "cloudscheduler.googleapis.com",
    "compute.googleapis.com",
    "cloudfunctions.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "run.googleapis.com",
    "serviceusage.googleapis.com"
  ]
}

variable "region" {
  description = "Region used to deploy the cloud functions and scheduler"
  default     = "europe-west1"
}

variable "schedule_cron" {
  description = "Cron format schedule to run the Cloud Function. Default is every 10 minutes."
  default     = "*/10 * * * *"
}

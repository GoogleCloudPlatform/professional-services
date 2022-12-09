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
  description = "Billing account id used as default for new projects."
  type        = string
  default     = null
}

variable "bundle_path" {
  description = "Path used to write the intermediate Cloud Function code bundle."
  type        = string
  default     = "./bundle.zip"
}


variable "bundle_path_cffile" {
  description = "Path used to write the intermediate Cloud Function code bundle."
  type        = string
  default     = "./bundle_cffile.zip"
}

variable "cai_config" {
  description = "Cloud Asset Inventory export config."
  type = object({
    bq_dataset         = string
    bq_table           = string
    bq_table_overwrite = bool
    target_node        = string
  })
}


variable "cai_gcs_export" {
  description = "Enable optional part to export tables to GCS."
  type        = bool
  default     = false
}


variable "file_config" {
  description = "Optional BQ table as a file export function config."
  type = object({
    bucket     = string
    filename   = string
    format     = string
    bq_dataset = string
    bq_table   = string
  })
  default = {
    bucket     = null
    filename   = null
    format     = null
    bq_dataset = null
    bq_table   = null
  }
}


variable "location" {
  description = "Appe Engine location used in the example."
  type        = string
  default     = "europe-west"
}


variable "name" {
  description = "Arbitrary string used to name created resources."
  type        = string
  default     = "asset-inventory"
}



variable "name_cffile" {
  description = "Arbitrary string used to name created resources."
  type        = string
  default     = "cffile-exporter"
}


variable "project_create" {
  description = "Create project instead ofusing an existing one."
  type        = bool
  default     = true
}

variable "project_id" {
  description = "Project id that references existing project."
  type        = string
}

variable "region" {
  description = "Compute region used in the example."
  type        = string
  default     = "europe-west1"
}

variable "root_node" {
  description = "The resource name of the parent folder or organization for project creation, in 'folders/folder_id' or 'organizations/org_id' format."
  type        = string
  default     = null
}

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

variable "cidrs" {
  description = "CIDR ranges for subnets."
  type        = map(string)
  default = {
    image-builder = "10.0.0.0/24"
  }
}

variable "create_packer_vars" {
  description = "Create packer variables file using template file and terraform output."
  type        = bool
  default     = false
}

variable "packer_account_users" {
  description = "List of members that will be allowed to impersonate Packer image builder service account in IAM format, i.e. 'user:{emailid}'."
  type        = list(string)
  default     = []
}

variable "packer_source_cidrs" {
  description = "List of CIDR ranges allowed to connect to the temporary VM for provisioning."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "project_create" {
  description = "Create project instead of using an existing one."
  type        = bool
  default     = true
}

variable "project_id" {
  description = "Project id that references existing project."
  type        = string
}

variable "region" {
  description = "Default region for resources."
  type        = string
  default     = "europe-west1"
}

variable "root_node" {
  description = "The resource name of the parent folder or organization for project creation, in 'folders/folder_id' or 'organizations/org_id' format."
  type        = string
  default     = null
}

variable "use_iap" {
  description = "Use IAP tunnel to connect to Compute Engine instance for provisioning."
  type        = bool
  default     = true
}

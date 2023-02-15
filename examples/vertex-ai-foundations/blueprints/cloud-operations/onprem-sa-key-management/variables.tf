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

variable "project_create" {
  description = "Create project instead of using an existing one."
  type        = bool
  default     = false
}

variable "project_id" {
  description = "Project id."
  type        = string
}

variable "service_accounts" {
  description = "List of service accounts."
  type = list(object({
    name              = string
    iam_project_roles = list(string)
    public_keys_path  = string
  }))
  default = [
    {
      name = "data-uploader"
      iam_project_roles = [
        "roles/bigquery.dataOwner",
        "roles/bigquery.jobUser",
        "roles/storage.objectAdmin"
      ]
      public_keys_path = "public-keys/data-uploader/"
    },
    {
      name = "prisma-security"
      iam_project_roles = [
        "roles/iam.securityReviewer"
      ]
      public_keys_path = "public-keys/prisma-security/"
    },
  ]

}

variable "services" {
  description = "Service APIs to enable."
  type        = list(string)
  default     = []
}

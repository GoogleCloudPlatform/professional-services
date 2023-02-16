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
  description = "Parameters for the creation of the new project."
  type = object({
    billing_account_id = string
    parent             = string
  })
  default = null
}

variable "project_id" {
  description = "Identifier of the project that will contain the Pub/Sub topic that will be created from Azure and the service account that will be impersonated."
  type        = string
}

variable "vm_test" {
  description = "Flag indicating whether the infrastructure required to test that everything works should be created in Azure."
  type        = bool
  default     = false
}

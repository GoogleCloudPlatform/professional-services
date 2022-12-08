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

variable "workload_identity_pool_provider_id" {
  description = "GCP workload identity pool provider ID."
  type        = string
}

variable "impersonate_service_account_email" {
  description = "Service account to be impersonated by workload identity federation."
  type        = string
}

variable "tmp_oidc_token_path" {
  description = "Name of the temporary file where TFC OIDC token will be stored to authentificate terraform provider google."
  type        = string
  default     = ".oidc_token"
}

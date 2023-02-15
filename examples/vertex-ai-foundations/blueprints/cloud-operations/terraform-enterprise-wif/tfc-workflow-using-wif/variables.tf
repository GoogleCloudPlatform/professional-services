# Copyright 2022 Google LLC
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
  description = "GCP project ID."
  type        = string
}

variable "impersonate_service_account_email" {
  description = "Service account to be impersonated by workload identity."
  type        = string
}

variable "workload_identity_pool_provider_id" {
  description = "GCP workload identity pool provider ID."
  type        = string
}

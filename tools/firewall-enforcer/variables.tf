# Copyright 2021 Google, LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
variable "org_id" {
  type        = string
  description = "Numeric organization ID"
}
variable "project_id" {
  type        = string
  description = "Project ID to deploy Function into"
}
variable "region" {
  type        = string
  description = "Region for deploying Function"
}
variable "zone" {
  type = string
}
variable "feed_id" {
  type        = string
  description = "Name of the Asset Inventory Feed"
  default     = "org_ai_feed_firewall"
}
variable "function_sa_name" {
  type        = string
  description = "Name of the service account the Cloud Function runs as"
}

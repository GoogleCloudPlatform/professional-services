# Copyright 2026 Google LLC
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
  description = "Shared project where teams call Gemini (and where the Provisioned Throughput order lives)."
  type        = string
}

variable "teams" {
  description = "Team names. One service account <team>-sa is created per team."
  type        = list(string)
  default     = ["team-a", "team-b"]
}

variable "caller_members" {
  description = "Principals allowed to impersonate the team accounts for testing, for example user:alice@example.com."
  type        = list(string)
  default     = []
}

variable "dataset_id" {
  description = "BigQuery dataset that receives the inference request metadata log."
  type        = string
  default     = "gemini_usage"
}

variable "bq_location" {
  description = "BigQuery dataset location."
  type        = string
  default     = "US"
}

variable "log_retention_days" {
  description = "Days to keep rows in the dataset. 400 keeps a full year for audits. Set 0 to keep forever."
  type        = number
  default     = 400
}

variable "delete_contents_on_destroy" {
  description = "Let terraform destroy delete the dataset even when it holds logs. Off by default to protect usage history."
  type        = bool
  default     = false
}

variable "sink_name" {
  description = "Name of the log sink that copies the metadata log to BigQuery."
  type        = string
  default     = "gemini-usage-sink"
}

variable "enable_metadata_logging" {
  description = "Turn on inference request metadata logs for every model in the project (needs curl and gcloud)."
  type        = bool
  default     = true
}

variable "enable_prompt_logging" {
  description = "Also log full prompts and responses. Not needed for cost tracking, and prompts may hold sensitive data."
  type        = bool
  default     = false
}

variable "prompt_logged_models" {
  description = "Models whose prompts and responses are logged when enable_prompt_logging is true."
  type        = list(string)
  default     = ["gemini-3.8-flash"]
}

variable "prompt_log_table" {
  description = "Table for prompt and response logging."
  type        = string
  default     = "prompt_response_log"
}

variable "location" {
  description = "Endpoint location of the models in prompt_logged_models, for example global or us-central1."
  type        = string
  default     = "global"
}

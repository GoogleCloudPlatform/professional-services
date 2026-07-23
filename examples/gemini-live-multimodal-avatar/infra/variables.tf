# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The Google Cloud region for deployment"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "The name of the service"
  type        = string
  default     = "live-api-demo"
}

variable "name_suffix" {
  description = "A suffix to append to resource names to avoid collisions (e.g. your username)"
  type        = string
  default     = ""
}

variable "use_vertex_ai" {
  description = "Set to true to use the Vertex AI Live API instead of the Developer API"
  type        = bool
  default     = false
}

variable "vertex_location" {
  description = "The location for Vertex AI (LLM). Use 'global' for best availability or a specific region for data residency."
  type        = string
  default     = "global"
}

variable "vertex_search_location" {
  description = "The location for Discovery Engine (Vertex Search). Must be global, us, or eu."
  type        = string
  default     = "global"

  validation {
    condition     = contains(["global", "us", "eu"], var.vertex_search_location)
    error_message = "vertex_search_location must be one of: global, us, eu."
  }
}

variable "data_bucket_name" {
  description = "The name of the GCS bucket for data storage. If empty, a default will be generated."
  type        = string
  default     = ""
}

variable "heygen_avatar_id" {
  description = "The ID of the HeyGen avatar to use"
  type        = string
  default     = "073b60a9-89a8-45aa-8902-c358f64d2852"
}

variable "google_ai_model" {
  description = "The Gemini model to use when USE_VERTEX_AI is false"
  type        = string
  default     = "gemini-3.1-flash-live-preview"
}

variable "vertex_ai_model" {
  description = "The Gemini model to use when USE_VERTEX_AI is true"
  type        = string
  default     = "gemini-live-2.5-flash-native-audio"
}

variable "vad_silence_duration_ms" {
  description = "Duration of silence (in milliseconds) before the server marks the end of a user's turn"
  type        = number
  default     = 400
}

variable "avatar_mode" {
  description = "Interaction modality (none, heygen, google_1p)"
  type        = string
  default     = "none"
}

variable "company_name" {
  description = "The name of the company/bank to customize prompt templates"
  type        = string
  default     = "Cymbal Bank"
}

variable "vertex_ai_avatar_model" {
  description = "The Gemini model to use for the whitelisted 1P Video Avatar"
  type        = string
  default     = "publishers/google/models/gemini-3.1-flash-live-preview-04-2026"
}

variable "scenario_cache_ttl_minutes" {
  description = "Scenario storage in-memory cache TTL in minutes"
  type        = number
  default     = 5
}

/**
 * Copyright 2024 Google LLC
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

terraform {
  backend "gcs" {
  }
  required_providers {
    google = {
        version = "5.38.0"
    }
    google-beta = {
        version = "5.38.0"
    }
  }
}

variable "project" {}

variable "region" {
    default = "us-central1"
}

variable "routine_dataset" {}

variable "claude_tokens" {
    type        = list(string)
    description = "Claude API token list."
    sensitive   = true
}

variable "max_batching_rows" {
    default = 3
}

variable "max_tokens" {
    type    = string
    default = "1024"
}

variable "system_prompt" {
    default = ""
}


output "remote_service_url" {
    value = google_cloudfunctions2_function.function.url
}
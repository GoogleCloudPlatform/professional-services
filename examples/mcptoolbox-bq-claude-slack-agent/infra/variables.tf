/**
 * Copyright 2025 Google LLC
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

variable "project_id" {
  description = "The Google Cloud project ID."
  type        = string
}

variable "claude_apikey" {
  description = "The API KEY used for Claude interactions."
  type        = string
}

variable "slackbot_workspace_token" {
  description = "The workspace token created when adding the slackbot."
  type        = string
}

variable "slackapp_signing_secret" {
  description = "The signing secret for the slack app."
  type        = string
}

variable "region" {
  description = "The Google Cloud region."
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "The name of the Cloud Run service."
  type        = string
  default     = "slack-claude-mcptoolbox-integration"
}

variable "artifact_registry_repository_name" {
  description = "The name of the Artifact Registry repository."
  type        = string
  default     = "slack-claude-mcptoolbox-integration-images"
}
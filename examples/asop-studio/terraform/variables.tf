# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

variable "project_id" {
  type        = string
  description = "The GCP Project ID where resources will be deployed."
}

variable "region" {
  type        = string
  default     = "us-central1"
  description = "The GCP region to deploy resources."
}

variable "service_name" {
  type        = string
  default     = "asop-studio"
  description = "Base name for the Cloud Run service and supporting resources."
}

variable "enable_iap" {
  type        = bool
  default     = false
  description = "Whether to provision an External HTTPS Load Balancer with Identity-Aware Proxy (IAP) in front of Cloud Run. Automatically enabled if iap_client_id and iap_client_secret are provided."
}

variable "iap_client_id" {
  type        = string
  default     = ""
  description = "The OAuth 2.0 Client ID for Identity-Aware Proxy (optional unless enable_iap = true)."
}

variable "iap_client_secret" {
  type        = string
  sensitive   = true
  default     = ""
  description = "The OAuth 2.0 Client Secret for Identity-Aware Proxy (optional unless enable_iap = true)."
}

variable "allowed_identities" {
  type        = list(string)
  default     = []
  description = "List of principals allowed to access ASOP Studio (e.g., ['user:alice@example.com']). Used for IAP access when IAP is enabled, or Cloud Run Invoker IAM when allow_unauthenticated = false."
}

variable "allow_unauthenticated" {
  type        = bool
  default     = true
  description = "When IAP is disabled, whether to allow public access to the Cloud Run URL (allUsers). Set to false to restrict access to allowed_identities via Cloud Run IAM."
}

variable "image_url" {
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello:latest"
  description = "The initial Docker image URL to deploy before deploy.sh pushes the built ASOP Studio image."
}

variable "domain_name" {
  type        = string
  default     = ""
  description = "Custom domain name for the Load Balancer when IAP is enabled (e.g. asop.example.com). If empty, a self-signed certificate is used."
}

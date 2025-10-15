# Copyright 2025 Google LLC
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

variable "gcp_project_id" {
  type        = string
  description = "The GCP Project ID for the development environment."
}

variable "gcp_region" {
  type        = string
  description = "The GCP region for the development environment."
}

variable "environment" {
  type        = string
  description = "The name of the environment, e.g., 'development'."
}

# --- Service Names ---
variable "backend_service_name" {
  type        = string
  description = "The full name of the backend Cloud Run service for this environment."
}

variable "frontend_service_name" {
  type        = string
  description = "The full name of the frontend Cloud Run service for this environment."
}

# --- GitHub Repo Details ---
variable "github_conn_name" {
  type        = string
  description = "The name of the Cloud Build GitHub connection."
}

variable "github_repo_owner" {
  type        = string
  description = "The owner of the GitHub repository."
}

variable "github_repo_name" {
  type        = string
  description = "The name of the GitHub repository."
}

variable "github_branch_name" {
  type        = string
  description = "The branch name to trigger builds from."
}

# --- Custom Audiences ---
variable "backend_custom_audiences" {
  type        = list(string)
  description = "List of custom audiences for the backend service."
}

variable "frontend_custom_audiences" {
  type        = list(string)
  description = "List of custom audiences for the frontend service."
}

# --- Service-Specific Environment Variables ---
variable "be_env_vars" {
  type        = map(map(string))
  description = "A map containing common and environment-specific variables for the backend."
}

variable "be_build_substitutions" {
  type        = map(string)
  description = "A map of substitution variables for the backend Cloud Build trigger."
  default     = {}
}

variable "fe_build_substitutions" {
  type        = map(string)
  description = "A map of substitution variables for the frontend Cloud Build trigger."
  default     = {}
}

variable "frontend_secrets" {
  type        = list(string)
  description = "A list of secret names required by the frontend build."
  default = []
}

variable "backend_secrets" {
  type        = list(string)
  description = "A list of secret names required by the backend build."
  default = []
}

variable "backend_runtime_secrets" {
  type        = map(string)
  description = "Secrets to mount in the backend container at runtime."
}


# --- List of APIs to enable ---
variable "apis_to_enable" {
  type        = list(string)
  description = "A list of Google Cloud APIs to enable on the project."
  default = [
    "serviceusage.googleapis.com",     # Required to enable other APIs
    "iam.googleapis.com",              # Required for IAM management
    "cloudbuild.googleapis.com",       # Required for Cloud Build
    "artifactregistry.googleapis.com", # Required for Artifact Registry
    "run.googleapis.com"               # Required for Cloud Run
  ]
}

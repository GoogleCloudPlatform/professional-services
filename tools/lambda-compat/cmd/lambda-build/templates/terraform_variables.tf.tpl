#   Copyright 2022 Google LLC
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

variable "project_id" {{"{"}}
  type        = string
  description = "Google Cloud Platform project ID"
  default     = "{{ .ProjectId }}"
{{"}"}}

variable "region" {{"{"}}
  type        = string
  description = "Google Cloud Platform region"
  default     = "{{ or .region "europe-west4" }}"
{{"}"}}

variable "container_url" {{"{"}}
  type        = string
  description = "Container image URL"
  default     = "{{ .Registry }}/{{ ToLower .Name }}"
{{"}"}}

variable "container_tag" {{"{"}}
  type        = string
  description = "Container image tag"
  default     = "{{ or .Tag "latest" }}"
{{"}"}}

variable "service" {{"{"}}
  type        = string
  description = "Cloud Run service name"
  default     = "{{ .Name }}"
{{"}"}}

variable "service_account" {{"{"}}
  type        = string
  description = "Service account name"
  default     = "{{ .Name }}"
{{"}"}}

variable "service_account_create" {{"{"}}
  type        = bool
  description = "Whether to create service account or use existing"
  default     = true
{{"}"}}

variable "create_load_balancer" {{"{"}}
  type        = bool
  description = "Whether to create a Global Load Balancer to front the function"
  default     = false
{{"}"}}

variable "oidc_audience" {{"{"}}
  type        = string
  description = "OIDC audience for Lambda compatibility"
  default     = "{{ .audience }}"
{{"}"}}

variable "role_arn" {{"{"}}
  type        = string
  description = "Role ARN for role assumption"
  default     = "{{ .rolearn }}"
{{"}"}}

variable "json_transform" {{"{"}}
  type        = string
  description = "JSON transformation template"
  default     = "{{ .jsontransform }}"
{{"}"}}




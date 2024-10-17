# Copyright 2020 Google LLC
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
  type = string
  description = "The Google Cloud project ID"
}

variable "region" {
  type = string
  description = "The region to deploy resources"
  default = "us-central1"
}

variable "db_name" {
  type = string
  description = "Name of the Firebase DB"
  default = "risk-analysis-db"
}

variable "db_location_id" {
    type = string
    description = "Location id of the DB"
    default = "nam5"
}

variable "db_project_id" {
    type = string
    description = "Project id of the DB"
}

variable "frontend_svc_name" {
  type = string
  description = "Name of the Frontend Cloud Run service"
}

variable "frontend_svc_location" {
  type = string
  description = "Region to deploy the Frontend service"
}

variable "frontend_svc_image" {
  type = string
  description = "Container image URL"
}

variable "frontend_svc_port" {
  type = number
  description = "Frontend service Container port"
  default = 8080
}

variable "backend_svc_name" {
  type = string
  description = "Name of the Backend Cloud Run service"
}

variable "backend_svc_location" {
  type = string
  description = "Region to deploy the Backend service"
}

variable "backend_svc_image" {
  type = string
  description = "Container image URL"
}

variable "backend_svc_port" {
  type = number
  description = "Backend service Container port"
  default = 8080
}

variable "env" {
    type = string
    description = "Environment - Development/Local/Production"
}

variable "enabled_apis" {
  description = "APIs enabled for Project"
  type = list(string)
}
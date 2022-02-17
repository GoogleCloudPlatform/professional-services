/**
 * Copyright 2021 Google LLC
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

variable "project_prefix" {
  description = "Segment to prefix all project names with."
  default     = "asm"
}

variable "region" {
  default = "us-west2"
}

variable "prefix"{
  default = "asm"
  description = "This is the prefix to differentiate the names of your artifacts"
}

variable "api_enabled_services_project_network" {
  type = list(string)
  default = [
    "container.googleapis.com",
    "dns.googleapis.com",
    "container.googleapis.com",
    "compute.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "meshca.googleapis.com",
    "meshtelemetry.googleapis.com",
    "meshconfig.googleapis.com",
    "meshca.googleapis.com",
    "meshtelemetry.googleapis.com",
    "iamcredentials.googleapis.com",
    "anthos.googleapis.com",
    "gkeconnect.googleapis.com",
    "gkehub.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com",
    "cloudtrace.googleapis.com",
    "monitoring.googleapis.com"
  ]
}

locals {
  # ASM specific
  mesh_id = "proj-${data.google_project.project.number}"

  # If we use a pre-built bastion server
  bastion_cidr = "10.0.0.0/24"

  # Use existing VPC
  existing_vpc = "your-vpc-name" # Replace with your VPC name
}

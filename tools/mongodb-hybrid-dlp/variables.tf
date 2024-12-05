# Copyright 2024 Google LLC
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
  type        = string
  description = "Google Cloud project ID"
}

variable "region" {
  type        = string
  description = "Region where to deploy the function and resources"
}

variable "scheduler_region" {
  type        = string
  description = "Region where to deploy the function and resources"
  default     = null
}

variable "vpc_config" {
  type = object({
    network         = string
    network_project = optional(string)
    subnetwork      = string
    subnet_cidr     = optional(string, "172.20.10.0/24")
    create          = optional(bool, true)
  })
  description = "Settings for VPC for MongoDB Private Link"
}

variable "run_period" {
  type        = number
  description = "Run function every N minutes"
  default     = 10
}

variable "mongodb_deployments" {
  type        = list(string)
  description = "MongoDB deployments to monitor for changes"
  default     = []
}

variable "mongodb_databases" {
  type        = list(string)
  description = "MongoDB databases to monitor for changes"
  default     = ["test"]
}

variable "mongodb_collections" {
  type        = list(string)
  description = "MongoDB collections to monitor for changes"
  default     = [] # eg. ["db.collection"]
}


variable "mongodbatlas_public_key" {
  type        = string
  description = "MongoDB Atlas public key"
}

variable "mongodbatlas_private_key" {
  type        = string
  description = "MongoDB Atlas private key"
}

variable "mongodbatlas_project_id" {
  type        = string
  description = "MongoDB Atlas project ID"
}

variable "mongodbatlas_instance_type" {
  type        = string
  description = "Instance type of MongoDB database (defaults to free, shared database, which does not support private endpoints)"
  default     = "M0"
}

# See list of M0 supporting regions in: https://www.mongodb.com/docs/atlas/reference/google-gcp/
variable "mongodbatlas_region" {
  type        = string
  description = "Region for the MongoDB instance"
  default     = "WESTERN_EUROPE"
}


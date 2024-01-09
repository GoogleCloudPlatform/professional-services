# Copyright 2022 Google LLC
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

variable "composer_env_name" {
  description = "Name of Cloud Composer Environment to be created."
  default     = "composer-env-eph-dataproc"
  type        = string
}

variable "dataproc_config" {
  description = "Dataproc cluster configuration to be created/used by Composer DAGs."
  type = object({
    dataproc_cluster_name  = string
    autoscaling_policy_id  = string
  })
  default = {
    dataproc_cluster_name  = "ephemeral-cluster-test"
    autoscaling_policy_id  = "dataproc-test-policy"
  }
  nullable = false
}

variable "dataproc_service_account" {
  description = "Service account to be created and used by ephemeral Dataproc clusters."
  default     = "ephemeral-dataproc-sa"
  type        = string
}

variable "network_config" {
  description = "Shared VPC network configurations to use. If null networks will be created in the project with preconfigured values."
  type = object({
    host_project       = string
    network_self_link  = string
    subnet_self_link   = string
    name               = string
    composer_secondary_ranges = object({
      pods     = string
      services = string
    })
  })
  default = null
}

variable "project_id" {
  description = "Project ID where all the resources will be created, including; Cloud Composer Environment, dataproc cluster, policies, buckets, etc. We assume this project already exists."
  type        = string
}

variable "region" {
  description = "Region where all the resources will be created, including; Cloud Composer Environment, dataproc cluster, policies, buckets, etc."
  default     = "europe-west1"
  type        = string
}

variable "service_account" {
  description = "Service account to be created and used by Composer environment."
  default     = "composer-env-service-account"
  type        = string
}
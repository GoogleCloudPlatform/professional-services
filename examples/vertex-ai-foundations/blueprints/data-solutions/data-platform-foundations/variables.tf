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

# tfdoc:file:description Terraform Variables.

variable "billing_account_id" {
  description = "Billing account id."
  type        = string
}

variable "composer_config" {
  description = "Cloud Composer config."
  type = object({
    node_count      = number
    airflow_version = string
    env_variables   = map(string)
  })
  default = {
    node_count      = 3
    airflow_version = "composer-1-airflow-2"
    env_variables   = {}
  }
}

variable "data_catalog_tags" {
  description = "List of Data Catalog Policy tags to be created with optional IAM binging configuration in {tag => {ROLE => [MEMBERS]}} format."
  type        = map(map(list(string)))
  nullable    = false
  default = {
    "3_Confidential" = null
    "2_Private"      = null
    "1_Sensitive"    = null
  }
}

variable "data_force_destroy" {
  description = "Flag to set 'force_destroy' on data services like BiguQery or Cloud Storage."
  type        = bool
  default     = false
}

variable "folder_id" {
  description = "Folder to be used for the networking resources in folders/nnnn format."
  type        = string
}

variable "groups" {
  description = "User groups."
  type        = map(string)
  default = {
    data-analysts  = "gcp-data-analysts"
    data-engineers = "gcp-data-engineers"
    data-security  = "gcp-data-security"
  }
}

variable "location" {
  description = "Location used for multi-regional resources."
  type        = string
  default     = "eu"
}

variable "network_config" {
  description = "Shared VPC network configurations to use. If null networks will be created in projects with preconfigured values."
  type = object({
    host_project      = string
    network_self_link = string
    subnet_self_links = object({
      load           = string
      transformation = string
      orchestration  = string
    })
    composer_ip_ranges = object({
      cloudsql   = string
      gke_master = string
      web_server = string
    })
    composer_secondary_ranges = object({
      pods     = string
      services = string
    })
    # web_server_network_access_control = list(string)
  })
  default = null
}

variable "organization_domain" {
  description = "Organization domain."
  type        = string
}

variable "prefix" {
  description = "Unique prefix used for resource names."
  type        = string
}

variable "project_services" {
  description = "List of core services enabled on all projects."
  type        = list(string)
  default = [
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "serviceusage.googleapis.com",
    "stackdriver.googleapis.com"
  ]
}

variable "project_suffix" {
  description = "Suffix used only for project ids."
  type        = string
  default     = null
}

variable "region" {
  description = "Region used for regional resources."
  type        = string
  default     = "europe-west1"
}

variable "service_encryption_keys" {
  description = "Cloud KMS to use to encrypt different services. Key location should match service region."
  type = object({
    bq       = string
    composer = string
    dataflow = string
    storage  = string
    pubsub   = string
  })
  default = null
}

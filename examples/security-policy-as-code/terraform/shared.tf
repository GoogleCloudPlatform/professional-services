# Copyright 2019 Google LLC
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

# Provider versions set to ~> 2.12 -- the maximum version for the `logging` component.
# TODO: Update the Providers to their latest versions as soon as the
# `terraform-google-log-export` module supports a version >= 3.0
provider "google" {
  version = "~> 2.12"
  region  = var.region
}

provider "google-beta" {
  version = "~> 2.12"
  region  = var.region
}

variable "billing_account" {
  description = "The ID of the associated billing account"
  default     = ""
}

variable "org_id" {
  description = "The ID of the Google Cloud Organization."
  default     = ""
}

variable "domain" {
  description = "The domain name of the Google Cloud Organization. Use this if you can't add Organization Viewer permissions to your TF ServiceAccount"
  default     = ""
}

variable "folder_id" {
  description = "The ID of the folder in which projects should be created (optional)."
  default     = ""
}

variable "project_prefix" {
  description = "Segment to prefix all project names with."
  default     = "pci-poc"
}

variable "region" {
  default = "us-central1"
}

variable "shared_vpc_name" {
  default     = "shared-vpc"
  description = "The name of the Shared VPC network"
}

variable "remote_state_bucket" {
  description = "GCS state bucket"
  default     = ""
}

variable "is_shared_vpc_host" {
  default = true
}

variable "network_project_id" {
  default = ""
}

variable "management_project_id" {
  default = ""
}

variable "in_scope_project_id" {
  default = ""
}

variable "out_of_scope_project_id" {
  default = ""
}

variable "override_inscope_sa_email" {
  default = ""
}

variable "enable_hipsterstore_app" {
  default = "true"
}

variable "enable_helloworld_app" {
  default = "false"
}

variable "gke_minimum_version" {
  default = "1.14.10-gke.27"
}

variable "cluster_location" {
  default = "us-central1-a"
}

variable "node_locations" {
  type    = list
  default = ["us-central1-b"]
}

variable "in_scope_cluster_name" {
  default = "in-scope"
}

variable "in_scope_pod_ip_range_name" {
  default = "in-scope-pod-cidr"
}

variable "in_scope_services_ip_range_name" {
  default = "in-scope-services-cidr"
}

variable "mgmt_subnet_cidr" {
  default = "10.10.1.0/24"
}

variable "mgmt_subnet_name" {
  default = "management"
}

variable "in_scope_subnet_name" {
  default = "in-scope"
}

variable "in_scope_subnet_cidr" {
  default = "10.10.10.0/24"
}

variable "out_of_scope_subnet_name" {
  default = "out-of-scope"
}

variable "out_of_scope_subnet_cidr" {
  default = "10.10.20.0/24"
}

variable "out_of_scope_pod_ip_range_name" {
  description = "The Name for the Secondary IP range used for Out of Scope Kubernetes Pods"
  default     = "out-of-scope-pod-cidr"
}

variable "out_of_scope_services_ip_range_name" {
  description = "The Name for the Secondary IP range used for Out of Scope Kubernetes Services"
  default     = "out-of-scope-services-cidr"
}

variable "forseti_cscc_source_id" {
  description = "Set the Cloud Security Command Center Source ID for Forseti integration"
  default     = ""
}

variable "forseti_cscc_violations_enabled" {
  description = "Enable Forseti Cloud Security Command Center integration by setting this to `true`. Default is `false`"
  default     = "false"
}

variable "bucket_location" {
  description = "Location of staging bucket for Cloud Function code"
  default     = "US"
}

variable "service_account_email" {
  description = "Name of service account used in with notifications module"
  default     = ""
}


// Some helper locals
locals {
  folder_id               = "${var.folder_id != "" ? var.folder_id : ""}"
  self_link_subnet_prefix = "projects/${local.project_network}/regions/${var.region}/subnetworks/"

  in_scope_subnet_self_link = "${local.self_link_subnet_prefix}${var.in_scope_subnet_name}"

  out_of_scope_subnet_self_link = "${local.self_link_subnet_prefix}${var.out_of_scope_subnet_name}"

  project_network      = var.network_project_id == "" ? "${var.project_prefix}-network" : var.network_project_id
  project_management   = var.management_project_id == "" ? "${var.project_prefix}-management" : var.management_project_id
  project_in_scope     = var.in_scope_project_id == "" ? "${var.project_prefix}-in_scope" : var.in_scope_project_id
  project_out_of_scope = var.out_of_scope_project_id == "" ? "${var.project_prefix}-out_of_scope" : var.out_of_scope_project_id
}

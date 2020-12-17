/**
 * Copyright 2020 Google LLC
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

provider "google" {
  region  = var.region
}
provider "google-beta" {
  region  = var.region
}
variable "billing_account" {
  description = "The ID of the associated billing account"
  default     = ""
}
variable "folder_id" {
  description = "The ID of the folder in which projects should be created (optional)."
  default     = ""
}
variable "project_prefix" {
  description = "Segment to prefix all project names with."
  default     = "asm"
}

variable "region" {
  default = "us-west2"
}

variable "default_admin_users" {
  type = list(string)
  description = "Default admin users to log into bastion server"
  default = [
    "user:jianhel@waheedsworkbench.com"
  ]
}
variable "prefix"{
  default = "asm"
  description = "This is the prefix to differentiate the names of your artifacts"
}

variable "application_services" {
  type = list(string)
  default = [
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

variable "api_enabled_services_project_network" {
  type = list(string)
  default = [
    "container.googleapis.com",
    "dns.googleapis.com"
  ]
}

locals {
  folder_id = var.folder_id

  # ASM specific
  mesh_id = "proj-${var.project_number}"

  # GCE Subnet for bastion server
  
  # If we use a pre-built bastion server
  #bastion_cidr = "34.94.17.157/32"
  bastion_cidr = "10.0.0.0/24"

  # Use existing VPC
  existing_vpc = "your-vpc-name" # Replace with your VPC name

  # cluster3 network details
  cluster3_subnet_name = "cluster3"
  cluster3_subnet_cidr = "10.184.19.0/24"

  cluster3_pod_ip_range_name = "cluster3-pod-cidr"
  cluster3_pod_ip_cidr_range = "10.185.128.0/18"

  cluster3_services_ip_range_name = "cluster3-services-cidr"
  cluster3_services_ip_cidr_range = "172.16.2.0/24"

  cluster3_master_ipv4_cidr_block                           = "192.168.2.0/28"
  cluster3_master_authorized_networks_config_1_display_name = "all"
  cluster3_master_authorized_networks_config_1_cidr_block   = "0.0.0.0/0"

  # cluster3 cluster details
  cluster3_cluster_name                 = "cluster3"
  cluster3_node_pool_initial_node_count = 1
  cluster3_cluster_release_channel      = "REGULAR"

  cluster3_node_pool_autoscaling_min_node_count = 1
  cluster3_node_pool_autoscaling_max_node_count = 5

  cluster3_node_pool_machine_type = "e2-standard-4"
  cluster3_network_tag            = "cluster3"

  cluster3_node_pool_oauth_scopes = [
    "https://www.googleapis.com/auth/compute",
    "https://www.googleapis.com/auth/devstorage.read_only",
    "https://www.googleapis.com/auth/logging.write",
    "https://www.googleapis.com/auth/monitoring",
    "https://www.googleapis.com/auth/trace.append",
    "https://www.googleapis.com/auth/cloud_debugger",
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/servicecontrol",
    "https://www.googleapis.com/auth/service.management.readonly"
  ]
  cluster3_node_pool_auto_repair     = true
  cluster3_node_pool_auto_upgrade    = true
  cluster3_node_pool_max_surge       = 1
  cluster3_node_pool_max_unavailable = 0

  # cluster4 network details
  cluster4_subnet_name = "cluster4"
  cluster4_subnet_cidr = "10.184.20.0/24"

  cluster4_pod_ip_range_name = "cluster4-pod-cidr"
  cluster4_pod_ip_cidr_range = "10.185.192.0/18"

  cluster4_services_ip_range_name = "cluster4-services-cidr"
  cluster4_services_ip_cidr_range = "172.16.3.0/24"

  cluster4_master_ipv4_cidr_block                           = "192.168.3.0/28"
  cluster4_master_authorized_networks_config_1_display_name = "all"
  cluster4_master_authorized_networks_config_1_cidr_block   = "0.0.0.0/0"

  # cluster4 cluster details
  cluster4_cluster_name                 = "cluster4"
  cluster4_node_pool_initial_node_count = 1
  cluster4_cluster_release_channel      = "REGULAR"

  cluster4_node_pool_autoscaling_min_node_count = 1
  cluster4_node_pool_autoscaling_max_node_count = 5
  cluster4_node_pool_machine_type               = "e2-standard-4"
  cluster4_network_tag                          = "cluster4"

  cluster4_node_pool_oauth_scopes = [
    "https://www.googleapis.com/auth/compute",
    "https://www.googleapis.com/auth/devstorage.read_only",
    "https://www.googleapis.com/auth/logging.write",
    "https://www.googleapis.com/auth/monitoring",
    "https://www.googleapis.com/auth/trace.append",
    "https://www.googleapis.com/auth/cloud_debugger",
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/servicecontrol",
    "https://www.googleapis.com/auth/service.management.readonly"
  ]
  cluster4_node_pool_auto_repair     = true
  cluster4_node_pool_auto_upgrade    = true
  cluster4_node_pool_max_surge       = 1
  cluster4_node_pool_max_unavailable = 0

  node_pool_preemptible = false
}

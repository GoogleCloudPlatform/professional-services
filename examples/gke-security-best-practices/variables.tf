# Copyright 2018 Google LLC
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

/*
  This file manages variables resources for the cluster
*/

variable project {
  default = "acme-dev"
}

variable name {
  default = "acme-dev"
}

variable region {
  default = "us-west2"
}

variable zone {
  default = "us-west2-a"
}

variable network_name {
  default = "acme-dev-cluster"
}

variable ip_cidr_range {
  default = "172.16.0.0/28"
}

variable pods_ip_cidr_range {
  default = "10.40.0.0/14"
}

variable services_ip_cidr_range {
  default = "10.0.16.0/20"
}

variable kubernetes_alpha {
  default = false
}

variable kubernetes_dashboard {
  default = true
}

variable http_load_balancing {
  default = false
}

variable horizontal_pod_autoscaling {
  default = false
}

variable daily_maintenance_window_start_time {
  default = "08:00"
} // is in UTC/GMT ^^

variable kubernetes_legacy_abac {
  default = false
}

variable private_ip_google_access {
  default = true
}

variable private_cluster {
  default = true
}

variable enable_binary_authorization {
  default = true
}

variable enable_private_endpoint {
  default = true
}

variable enable_private_nodes {
  default = true
}

variable auto_create_subnetworks {
  default = false
}

variable master_ipv4_cidr_block {
  default = "192.168.0.0/28"
}

variable additional_zones {
  default = [
    "us-west2-b",
    "us-west2-c",
  ]
}

variable node_config_svc_account {
  default = "k8s-nodes-acme-dev-gke"
}

variable node_count {
  default = 1
}

variable min_node_count {
  default = 1
}

variable max_node_count {
  default = 3
}

variable preemptible {
  default = false
}

variable disk_size_gb {
  default = 75
}

variable local_ssd_count {
  default = "1"
}

variable disk_type {
  default = "pd-ssd"
}

variable machine_type {
  default = "n1-standard-1"
}

variable "image_type" {
  default = "COS"
}

//provide appropriate path for Bastion VM Image from Packer script output
variable bastion_image {
  default = "projects/acme-dev/global/images/acme-ubuntu-1804-bionic-base-1541362924"
}

variable min_cpu_platform {
  default = "Intel Skylake"
}

variable logging_service {
  default = "logging.googleapis.com/kubernetes"
}

variable monitoring_service {
  default = "monitoring.googleapis.com/kubernetes"
}

variable gke_oauth_scopes {
  default = [
    "https://www.googleapis.com/auth/compute",
    "https://www.googleapis.com/auth/devstorage.read_only",
    "https://www.googleapis.com/auth/logging.write",
    "https://www.googleapis.com/auth/monitoring",
    "https://www.googleapis.com/auth/servicecontrol",
    "https://www.googleapis.com/auth/service.management.readonly",
    "https://www.googleapis.com/auth/trace.append",
  ]
}

variable bastion_svc_account {
  default = "bastion-acme-dev-gke"
}

variable bastion_oath_scopes {
  default = [
    "https://www.googleapis.com/auth/compute",
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/devstorage.read_only",
    "https://www.googleapis.com/auth/logging.write",
    "https://www.googleapis.com/auth/monitoring",
    "https://www.googleapis.com/auth/servicecontrol",
    "https://www.googleapis.com/auth/service.management.readonly",
    "https://www.googleapis.com/auth/trace.append",
  ]
}

variable ssh_firewall_rule_name {
  default = "bastion-acme-dev-gke-ssh"
}

//update with array of permissable source addresses
variable ssh_source_ranges {
  default = ["nnn.nnn.nnn.nnn/32"]
}

variable "auto_repair" {
  description = "Whether the nodes will be automatically repaired."
  default     = true
}

variable "workload_metadata_config" { 
  default = "SECURE"
}

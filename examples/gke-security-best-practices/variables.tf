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

variable project {
  description = "Set the project id."
}

variable name {
  description = "Set the project name/prefix."
}

variable region {
  description = "Set a project region."
}

variable zone {
  description = "Set a project zone."
}

variable network_name {
  description = "Set a name for the custom network."
}

variable ip_cidr_range {
  description = "Set a custom ip cidr range."
}

variable pods_ip_cidr_range {
  description = "Set a custom ip cidr range for the PODs."
}

variable services_ip_cidr_range {
  description = "Set a custom ip cidr range for the services."
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
  description = "Define a maintenane window for the cluster. The time is in UTC/GMT."
}

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
  description = "Set the master ipv4 cidr block."
}

variable additional_zones {
  type        = "list"
  description = "Set some additional zones for high availability."
}

variable node_config_svc_account {
  description = "Set a custom service account for worker nodes."
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

variable bastion_image {
  description = "Select a security hardened image for our SSH bastion host"
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
  description = "Constrain GCP services scopes for GKE worker nodes."

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
  description = "Set a custom service account for the bastion compute instance"
}

variable bastion_svc_account_role {
  description = "Set appropriate role bindings for bastion instance service account"
  default     = "roles/container.admin"
}

variable bastion_oath_scopes {
  # TODO: try to clean up scopes
  description = "Constrain GCP services scopes for bastion instance."

  default = [
    "https://www.googleapis.com/auth/cloud-platform",
  ]
}

variable ssh_firewall_rule_name {
  default = "bastion-gke-ssh"
}

#update with array of permissable source addresses
variable ssh_source_ranges {
  type        = "list"
  description = "Constrain allowable sources that can connect to the ssh bastion."
}

variable "auto_repair" {
  description = "Whether the nodes will be automatically repaired."
  default     = true
}

variable "workload_metadata_config" {
  description = "Harden the medata service."
  default     = "SECURE"
}

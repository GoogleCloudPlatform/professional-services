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
  description = "The project ID to host the cluster in"
}

variable name {
  description = "The project name/prefix"
}

variable region {
  description = "The region to host the cluster in"
}

variable zone {
  description = "The zone to host the cluster in"
}

variable network_name {
  description = "The VPC network to host the cluster in"
}

variable ip_cidr_range {
  description = "Set a custom ip cidr range"
}

variable pods_ip_cidr_range {
  description = "The secondary ip range to use for pods"
}

variable services_ip_cidr_range {
  description = "The secondary ip range to use for services"
}

variable kubernetes_alpha {
  description = "Disable Kubernetes alpha features"
  default     = false
}

variable kubernetes_dashboard {
  description = "Disable Kubernetes web UI in favor of GKE Cloud Console"
  default     = true
}

variable http_load_balancing {
  description = "Set this to false to ensure that the HTTP L7 load balancing controller addon is enabled"
  default     = false
}

variable daily_maintenance_window_start_time {
  description = "Define a maintenane window for the cluster. The time is in UTC/GMT"
}

variable kubernetes_legacy_abac {
  description = "Disable Kubernetes web UI in favor of Cloud Console - GKE UI, gcloud, or kubectl interfaces"
  default     = false
}

variable private_ip_google_access {
  description = "Enable GCP services private IP access"
  default     = true
}

variable private_cluster {
  description = "Make this a private cluster"
  default     = true
}

variable enable_binary_authorization {
  description = "Enable Binary Authorization"
  default     = true
}

variable enable_private_endpoint {
  description = "Make the API endpoint a private address"
  default     = true
}

variable enable_private_nodes {
  description = "Give the worker nodes private IP addresses"
  default     = true
}

variable auto_create_subnetworks {
  description = "Disable auto-creation of subnetworks, allow creation of custom subnetworks"
  default     = false
}

variable master_ipv4_cidr_block {
  description = "Set the master ipv4 cidr block"
}

variable additional_zones {
  type        = "list"
  description = "Set some additional zones for high availability"
}

variable node_config_svc_account {
  description = "Set a custom service account for worker nodes"
}

variable node_count {
  description = "Starting number of nodes in each zone"
  default     = 1
}

variable min_node_count {
  description = "Starting minimum number of nodes in each zone"
  default     = 1
}

variable max_node_count {
  description = "Maximum number of nodes in each zone"
  default     = 3
}

variable preemptible {
  description = "Whether the nodes are created as preemptible VM instances"
  default     = false
}

variable disk_size_gb {
  description = "Disk size in GB"
  default     = 75
}

variable local_ssd_count {
  description = "Number of local SSDs"
  default     = "1"
}

variable disk_type {
  description = "Disk Type"
  default     = "pd-ssd"
}

variable machine_type {
  description = "Machine Type"
  default     = "n1-standard-1"
}

variable "image_type" {
  description = "Worker node image Type"
  default     = "COS"
}

variable bastion_image {
  description = "Select a security hardened image for our SSH bastion host"
}

variable min_cpu_platform {
  description = "Select a CPU platform for our compute instances"
  default     = "Intel Skylake"
}

variable logging_service {
  description = "Select a logging service with Kubernetes resources enabled"
  default     = "logging.googleapis.com/kubernetes"
}

variable monitoring_service {
  description = "Select a monitoring service with Kubernetes resources enabled"
  default     = "monitoring.googleapis.com/kubernetes"
}

variable gke_worker_oauth_scopes {
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
  description = "Constrain GCP services scopes for bastion instance."

  default = [
    "https://www.googleapis.com/auth/cloud-platform",
  ]
}

variable ssh_firewall_rule_name {
  description = "Configure a firewall rule to constrai access to our bastion host"
  default     = "bastion-gke-ssh"
}

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

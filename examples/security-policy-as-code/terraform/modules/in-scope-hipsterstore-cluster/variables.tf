
variable "service_account_email" {
  description = "The Service Account Email ID to use for the Cluster"
}

variable "enabled" {
  description = "This module can be disabled by explicitly setting this to `false`. Default is `true`"
  default     = "true"
}

variable "project_id" {
  description = "The project to build this module's infrastructure"
}

variable "region" {
  description = "The region for this module's infrastructure"
}

variable "network_self_link" {
  description = "The complete self link ID for the VPC network"
}

variable "network_project_id" {
  description = "The project that contains the VPC for this module"
}

variable "subnetwork_name" {
  description = "The simple name of the subnetwork."
}

variable "gke_minimum_version" {
  description = "The minimum version to use for the GKE cluster"
  default     = "1.14.10-gke.27"
}

variable "cluster_location" {
  description = "The Zonal location of the GKE cluster master"
  default     = "us-central1-a"
}

variable "node_locations" {
  description = "The locations of the GKE cluster nodes"
  type        = list
  default     = ["us-central1-b"]
}

variable "cluster_tags" {
  type        = list
  description = "Tags to apply on the cluster"
  default     = ["in-scope"]
}

variable "env" {
  description = "The value of an `env` label to apply to the cluster"
  default     = "pci"
}

variable "pod_ip_range_name" {
  description = "The Secondary IP Range name for Pods"
}

variable "services_ip_range_name" {
  description = "The Secondary IP Range name for Services"
}

variable "mgmt_subnet_cidr" {
  description = "The IP CIDR block to allow access to for API calls and Management access. Don't set this to 0.0.0.0/0"
}

variable "cluster_name" {
  default     = "in-scope"
  description = "The name of the Cluster"
}

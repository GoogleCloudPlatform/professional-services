variable "project_id" {
  description = "The GCP project you want to manage"
  type        = string
}

variable "region" {
  description = "The GCP region for NFS volumes"
  type        = string
  default     = "us-west2"
}

variable "allowed_clients" {
  description = "The GCP region for NFS volumes"
  type        = string
  default     = "172.16.2.0/24"
}

variable "network_name" {
  description = "VPC Network name"
  type        = string
  default     = "custom-vpc-1"
}

variable "service_level" {
  description = "The performance of the service level of volume. Must be one of \"standard\", \"premium\", \"extreme\", default is \"premium\"."
  type        = string
  default     = "premium"
}

variable "nfs-volumes" {
  description = "NFS Volumes to create."
  type        = any
  default     = {}
}
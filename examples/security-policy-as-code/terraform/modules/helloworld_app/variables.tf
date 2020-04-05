variable "region" {
  description = "The region for this module's infrastructure"
}
variable "service_account_email" {
  description = "The Service Account Email ID to use for the Cluster"
}

//variable "enabled" {
//  description = "This module can be disabled by explicitly setting this to `false`. Default is `true`"
//  default     = "true"
//}

variable "project_id" {
  description = "The project to build this module's infrastructure"
}

variable "disk_encryption_key" {
  description = "The KMS Key self link to use for Disk Encryption"
}
variable "network_project_id" {
  description = "The project that contains the VPC for this module"
}

variable "subnetwork_name" {
  description = "The simple name of the subnetwork."
}

variable "vpc_name" {
  description = "The Name of the VPC to use for this module"
}

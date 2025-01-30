# ---------------------------------------------------------------------------------------------------------------------
# REQUIRED PARAMETERS
# These variables are expected to be passed in by the operator
# ---------------------------------------------------------------------------------------------------------------------
############################
###        PROJECT      ###
############################

variable "project_id" {
  description = "The project ID for resrouces."
  type        = string
}

variable "region" {
  description = "The region for resources."
  type        = string
}

variable "zone" {
  description = "The zone for the resources."
  type        = string
}



############################
### Google Managed Kafka ###
############################

variable "image" {
  type        = string
  description = "GCE Image"
  default = "debian-cloud/debian-11"
}

variable "name" {
  type        = string
  description = "The name of Google Managed Instance"
}



variable "google_provider_version" {
  type    = string
  default = "~> 6.0.0"
}

variable "shared_vpc_name" {
  description = "Shared VPC Name"
  type        = string
}

variable "shared_vpc_subnetwork" {
  description = "Shared VPC Subnet"
  type        = string
}


variable "service_account_email" {
  description = "service account email"
  type        = string
}

variable "machine_type" {
  description = "GCE Instance Type"
  type        = string
  default = "n2d-standard-2"
}

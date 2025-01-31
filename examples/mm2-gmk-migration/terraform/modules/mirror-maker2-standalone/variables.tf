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
  default = "n2d-standard-8"
}


variable "mm2-binaries-bucket" {
  description = "Bucket for binaries."
  type        = string
  default = "gs://mm2-binaries-bucket"
}

variable "mm2-bucket-name" {
  description = "Bucket for binaries."
  type        = string
  default = "mm2-binaries-bucket"
}

variable "mm2_count" {
  description = "mm2 instance count."
  type        = string
}

variable "mm2-path" {
  description = "The directory on MM2 VMs where the binaries are insalled"
  type        = string
  default = "/opt"
}

variable "kafka_cluster_src_broker" {
  type        = string
  description = "The name of soruce kafka cluster"
}


variable "kafka_cluster_dest_broker" {
  type        = string
  description = "The name of destination kafka cluster"
}
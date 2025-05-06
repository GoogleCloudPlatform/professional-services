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
### Google Managed Kafka Connnect and MM2 Connectors###
############################


variable "mkc_cluster_name" {
  type        = string
  description = "The name of Google Managed Kafka Connnect"
}

variable "mkc_dest_cluster_id" {
  type        = string
  description = "The name of Google Managed Kafka Connnect Destination Cluster"
}

variable "mkc_src_cluster_id" {
  type        = string
  description = "The name of Google Managed Kafka Connnect Source Cluster"
}

variable "gmk_src_region" {
  description = "The source gmk region."
  type        = string
}

variable "gmk_dst_region" {
  description = "The destination gmk region."
  type        = string
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


variable "kafka_cluster_src_broker" {
  type        = string
  description = "The name of soruce kafka cluster"
}


variable "kafka_cluster_dest_broker" {
  type        = string
  description = "The name of destination kafka cluster"
}
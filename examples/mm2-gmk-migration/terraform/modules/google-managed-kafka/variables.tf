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


############################
### Google Managed Kafka ###
############################

variable "rebalance_config" {
  type        = string
  description = "A user-defined name of the Cloud Composer Instance prefix"
  default = "AUTO_REBALANCE_ON_SCALE_UP"
}

variable "name" {
  type        = string
  description = "The name of Google Managed Kafka Cluster"
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

variable "vcpu_count" {
  description = "Managed Kafka vcpu count between 3 and 15 The number must also be a multiple of 3"
  type        = string
  default = "3"
}

variable "memory_bytes" {
  description = "Managed Kafka memory in bytes between 1 GiB and 8 GiB per vCPU"
  type        = string
  default = "3221225472"
}


variable "kafka_topic_id" {
  description = "Kafka Topic ID/Name"
  type        = string
  default = "2"
}

variable "kafka_topic_partition_count" {
  description = "Kafka Topic Partition Count"
  type        = string
  default = "2"
}

variable "kafka_topic_replication_factor" {
  description = "Kafka Topic Replication Factor"
  type        = string
  default = "3"
}

variable "kafka_topic_retention_ms" {
  description = "Kafka Topic retention ms"
  type        = string
  default = "-1"
}

variable "kafka_topic_cleanup_policy" {
  description = "Kafka Topic Cleanup Policy"
  type        = string
  default = "compact"
}

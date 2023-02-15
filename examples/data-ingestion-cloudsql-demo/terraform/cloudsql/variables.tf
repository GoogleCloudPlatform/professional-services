# Copyright 2022 Google. This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

variable "project" {
  description = "The project to deploy to, if not set the default provider project is used."
  default     = "prabha-dbt"
}

variable "region" {
  description = "Region for cloud resources"
  default     = "europe-west3"
}

variable "authorized_networks" {
  description = "The authorized for network"
  type        = map(any)
  default = {
    "dbeaver" = "83.86.168.163/32"
  }
}

variable "database_version" {
  description = "The version of of the database. For example, `MYSQL_5_6` or `POSTGRES_9_6`."
  default     = "POSTGRES_9_6"
}

variable "tier" {
  description = "The machine tier (First Generation) or type (Second Generation). See this page for supported tiers and pricing: https://cloud.google.com/sql/pricing"
  default     = "db-f1-micro"
}

variable "instance_name" {
  description = "Name of the default instance to create"
  default     = "test-1"
}

variable "db_name" {
  description = "Name of the default database to create"
  default     = "tf-db1"
}

variable "user_name" {
  description = "The name of the default user"
  default     = "cloudsql"
}

variable "user_host" {
  description = "The host for the default user"
  default     = "%"
}
 
variable "user_password" {
  description = "The password for the default user. If not set, a random one will be generated and available in the generated_user_password output variable."
  default     = ""
}
 
variable "network_name" {
  type        = string
  description = "Network in which Cloud SQL should reside. Format as returned by google_compute_network"
  default     = "private-network"
}

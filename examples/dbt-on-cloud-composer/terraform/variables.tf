variable "region" {
  description = "The region for resources and networking"
  type = string
  default = "us"
}

variable "organization" {
  description = "Organization for the project/resources"
  type = string
}

variable "prefix" {
  description = "Prefix used to generate project id and name."
  type        = string
  default     = null
}

variable "root_node" {
  description = "Parent folder or organization in 'folders/folder_id' or 'organizations/org_id' format."
  type        = string
}

variable "billing_account_id" {
  description = "Billing account for the projects/resources"
  type = string
}

variable "owners" {
  description = "List of owners for the projects and folders"
  type = list(string)
}

variable "quota_project" {
  description = "Quota project used for admin settings"
  type = string
}

variable "composer1_image" {
  description = "Composer1 image to be pulled"
  type = string
  default = "composer-1.17.7-airflow-2.1.4"
}

variable "composer2_image" {
  description = "Composer2 image to be pulled"
  type = string
  default = "composer-2.0.0-preview.3-airflow-2.1.2"
}

variable "dbt_run_environment" {
  description = "DBT runtime profile"
  type = string
  default = "remote"
}

variable dbt_source_data_project {
  description = "Source project for the test data"
  type = string
  default = "bigquery-public-data"
}
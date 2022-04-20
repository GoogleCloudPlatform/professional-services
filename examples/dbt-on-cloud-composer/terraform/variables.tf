variable "region" {
  description = "The region for resources and networking"
  type = string
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

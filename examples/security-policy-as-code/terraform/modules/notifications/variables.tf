variable "project_id" {
  description = "Project the resources are deployed to"
}

variable "bucket_location" {
  description = "Location of staging bucket for Cloud Function code"
}

variable "bucket_name" {
  description = "Name of staging bucket for Cloud Function code"
}

variable "service_account_email" {
  description = "Email of Service Account used to run Cloud Function"
}
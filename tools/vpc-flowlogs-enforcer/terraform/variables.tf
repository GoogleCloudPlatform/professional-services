/*
 * Copyright 2021 Google LLC. This software is provided as-is, without warranty
 * or representation for any use or purpose. Your use of it is subject to your 
 * agreement with Google.  
 */

variable "terraform_service_account" {
  description = "Service account email of the account to impersonate to run Terraform."
  type        = string
}

variable "project_id" {
  description = "The GCP project ID"
}

variable "gcp_org_id" {
  description = "The GCP organization ID"
}

variable "root_folder_id" {
  description = "The folder where the demo project will be located"
  default     = null
}

variable "gcp_billing_account_id" {
  type        = string
  description = "GCP Billing account ID"
}

variable "gcp_services" {
  type        = list(any)
  description = "GCP services that need to be activated in the demo project"
  default = [
    "cloudfunctions.googleapis.com",
    "cloudasset.googleapis.com",
    "pubsub.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "cloudbilling.googleapis.com",
    "serviceusage.googleapis.com",
    "storage-api.googleapis.com",
    "storage-component.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudasset.googleapis.com",
  ]
}

variable "region" {
  description = "Region to build infrastructure"
  default     = "europe-west4"
}

variable "enforcement_folders" {
  description = "The list of folders under which the rule will be applied."
  type        = list(any)
}

variable "log_config" {
  description = "The VPC flow logs configuration to use. See https://cloud.google.com/compute/docs/reference/rest/v1/subnetworks for details."
  type        = map(any)
  default     = null
}

variable "configure_log_sinks" {
  description = "Configure the log sinks that will trigger the cloud function"
  type        = bool
  default     = true
}

variable "configure_asset_feeds" {
  description = "Configure the Cloud Asset Inventory feeds that will trigger the cloud function"
  type        = bool
  default     = true
}

variable "random_suffix" {
  description = "Add a random suffix to some resources to make it simpler to run tests."
  default     = true
}

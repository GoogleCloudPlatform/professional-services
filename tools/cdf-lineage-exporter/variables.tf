variable "project" {
  description = "The name of the project to containing FHIR store / BQ Dataset"
  type        = string
}

variable "region" {
  description = "The region that this terraform configuration will instanciate at."
  default     = "us-central1"
}

variable "cloud_functions_source_bucket" {
  description = "bucket to stage source zip archives for cloud functions"
}

variable "lineage_export_bucket" {
  description = "bucket to store CDAP lineage"
}

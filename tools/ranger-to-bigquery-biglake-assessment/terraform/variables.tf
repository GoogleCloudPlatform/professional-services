variable "project_id" {
  type        = string
  description = "Project id."
}

variable "storage_region" {
  type        = string
  description = "region"
  default     = "europe-west4"
}

variable "dataset_id" {
  type        = string
  description = "Dataset name where the tables are created."
  default     = "ranger_assessment"
}

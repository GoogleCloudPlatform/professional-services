# BigQuery variables
variable "project" {
}

variable "dataset_name" {
  default = "dataflow_production_ready"
}

variable "dataset_location" {
  description = "Dataset Location"
  default     = "EU"
}

variable "bq_path_to_schemas" {
  description = "Local path to bq schemas"
  default     = "../schemas"
}
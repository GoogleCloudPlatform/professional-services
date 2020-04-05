variable "project_id" {
  description = "The Project to monitor with this module's various log and metric components"
}

variable "force_destroy_logging_bucket" {
  description = "Set to true to allow Terraform to destroy this bucket even when it still has log files"
  default     = "false"
}

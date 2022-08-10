variable "project_id" {
  description = "Project ID where all this will be steup."
  type        = string
}

variable "region" {
  description = "Region where all this will be steup."
  type        = string
}


variable "zone" {
  description = "Zone where all this will be steup."
  type        = string
}

variable "bigquery_location" {
  description = "Location of CCM Bigquery Dataset"
  type        = string
}

variable "ccm-trigger-pubsub-topic" {
  description = "PubSub topic used to trigger composer build"
  type        = string
}

variable "ccm-delete-pubsub-topic" {
  description = "PubSub topic used to delete the composer build"
  type        = string
}

variable "ccm-scheduler-trigger-name" {
  description = "Scheduler name for Composer trigger"
  type        = string
}

variable "ccm-scheduler-trigger-frecuency" {
  description = "Scheduler cron expresion"
  type        = string
}

variable "project_number" {
  description = "Project Numer"
  type = string
}
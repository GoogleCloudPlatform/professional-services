variable "projectid" {
  description = "Unique ID for your GCP project"
  default = "kardiff-fltr-terraform-3"
}

variable "app_engine_region" {
  description = "Region for Cloud Scheduler; must be the same as App Engine region"
  default = "us-east1"
}

variable "cloud_functions_region" {
  description = "Region for Cloud Functions"
  default = "us-east1"
}

variable "stt_queue_topic_name" {
  description = "Name for PubSub topic that will hold queue of STT jobs"
  default = "stt_queue"
}

variable "stt_queue_subscription_name" {
  description = "Name for PubSub subscription to pull STT jobs ids from topic"
  default = "pull_stt_ids"
}

variable "cron_topic_name" {
  description = "Name for PubSub topic that will trigger Read STT Function from Cloud Scheduler"
  default = "cron_topic"
}

variable "scheduler_frequency" {
  description = "Frequency in UNIX cron that determines how often Cloud Scheduler will run"
  default = "*/10 * * * *"
}
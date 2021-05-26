variable "home_project" {
  description = "Host Project ID"
  type        = string
}

variable "region" {
  description = "Region of the App Engine Deployment"
  type        = string
}

variable "credentials" {
  description = "Path to Service Account Credentials file"
  type = string
  default = "CREDENTIALS_FILE.json"
}
variable "alert_data_scanning_frequency" {
  description = "Alert data generation frequency"
  type        = string
  default     = "every 15 mins"
}

variable "big_query_alert_dataset_id" {
  description = "Big Query Alert Dataset Id"
  type        = string
  default = "quota_monitoring_alert_dataset"
}

variable "big_query_alert_table_id" {
  description = "Big Query Alert Table Id"
  type        = string
  default = "quota_monitoring_alert_table"
}

variable "big_query_dataset_id" {
  description = "Big Query Dataset ID"
  type        = string
  default = "quota_monitoring_dataset"
}

variable "big_query_table_id" {
  description = "BigQuery Table ID"
  type        = string
  default = "quota_monitoring_table"
}

variable "bigquery_data_transfer_query_name" {
  description = "Name of the BigQuery scheduled query to generate alert data"
  type        = string
  default = "extract-quota-usage-alerts"
}

variable "cloud_function_list_project" {
  description = "Cloud Function name to list projects. Functions in a given region in a given project must have unique (case insensitive) names"
  type        = string
  default = "listProjects"
}

variable "cloud_function_notification_project" {
  description = "Cloud Function name to send notifications. Functions in a given region in a given project must have unique (case insensitive) names"
  type        = string
  default = "sendNotifications"
}

variable "cloud_function_scan_project" {
  description = "Cloud Function name to scan project for quotas. Functions in a given region in a given project must have unique (case insensitive) names"
  type        = string
  default = "scanProjects"
}

variable "cron_job_frequency" {
  description = "Cron job frequency for Cloud Scheduler"
  type        = string
  default     = "0 0 * * *"
}

variable "dataflow_job_name" {
  description = "Dataflow Job Name"
  type        = string
  default     = "quota_monitoring_dataflow_job"
}

variable "dataflow_job_temp_storage" {
  description = "Dataflow job temp bucket. The bucket name must be unique globally."
  type        = string
}

variable "log_bucket_name" {
  description = "Bucket Name for Log Sink (must be globally unique)"
  type        = string
}

variable "log_sink_name" {
  description = "Name for Log Sink"
  type        = string
  default = "quota-monitoring-sink"
}

variable "organizations" {
  description = "Organization ID to scan projects within whole organization"
  type        = string
  default     = ""
}

variable "retention_days" {
  description = "Log Sink Bucket's retention period in days"
  default     = 30
  type        = number
}

variable "service_account_email" {
  description = "Service Account email id to deploy resources and scan project quotas."
  type        = string
}

variable "threshold" {
  description = "Quota threshold at which the alerts should be triggered"
  type        = string
  default     = "75"
}

variable "topic_alert_notification" {
  description = "Pub/Sub Topic name to send notification"
  type        = string
  default     = "quota-notifications-topic"
}

variable "topic_alert_project_id" {
  description = "Pub/Sub Topic name to list projects in parent node"
  type        = string
  default     = "list-quota-monitoring-projects-topic"
}

variable "topic_alert_project_quota" {
  description = "Pub/Sub Topic name to scan project quotas"
  type        = string
  default     = "scan-quota-monitoring-projects-topic"
}

variable "notification_email_address" {
  description = "Email Address to receive email notifications"
  type        = string
}


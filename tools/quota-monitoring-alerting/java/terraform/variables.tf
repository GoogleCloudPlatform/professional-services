/*
Copyright 2022 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
variable "project_id" {
  description = "Value of the Project Id to deploy the solution"
  type        = string
}

variable "region" {
  description = "Value of the region to deploy the solution. Use the same region as used for App Engine"
  type        = string
}

variable "service_account_email" {
  description = "Value of the Service Account"
  type        = string
}

variable "topic_alert_project_id" {
  description = "Value of the Pub/Sub topic Id to publish Project Ids from Cloud Function"
  type        = string
  default     = "quota-monitoring-topic-project-id"
}

variable "topic_alert_project_quota" {
  description = "Value of the Pub/Sub topic Id to publish Project's quota from Cloud Function"
  type        = string
  default     = "quota-monitoring-topic-project"
}

variable "topic_alert_notification" {
  description = "Value of the Pub/Sub topic Id to publish quota alerts from Big Query"
  type        = string
  default     = "quota-monitoring-topic-alert"
}

variable "scheduler_cron_job_name" {
  description = "Value of name of cron job scheduler"
  type        = string
  default     = "quota-monitoring-cron-job"
}

variable "scheduler_cron_job_description" {
  description = "Value of description of cron job scheduler"
  type        = string
  default     = "trigger quota monitoring scanning"
}

variable "scheduler_cron_job_frequency" {
  description = "Value of the cron job frequency to trigger the solution"
  type        = string
  default     = "0 0 * * *" //once in 24 hours
}

variable "scheduler_cron_job_timezone" {
  description = "Value of the timezone of cron job scheduler"
  type        = string
  default     = "America/Chicago"
}

variable "scheduler_cron_job_deadline" {
  description = "Value of the The deadline for job attempts of cron job scheduler"
  type        = string
  default     = "540s"
}

variable "source_code_bucket_name" {
  description = "Value of cloud storage bucket to download source code for Cloud Function"
  type        = string
  default     = "quota-monitoring-solution-source"
}

variable "source_code_zip" {
  description = "Value of List and Scan Project Quotas source code zip file"
  type        = string
  default     = "quota-monitoring-solution.zip"
}

variable "source_code_notification_zip" {
  description = "Value of Notification Quota Alerts source code zip file"
  type        = string
  default     = "quota-monitoring-notification.zip"
}

variable "source_code_repo_url" {
  description = "Value of List and Scan Project Quotas source code git url"
  type        = string
  default     = "https://github.com/GoogleCloudPlatform/professional-services/tree/main/tools/quota-monitoring-alerting/quota-scan"
}

variable "source_code_notification_repo_url" {
  description = "Value of Notification Quota Alerts source code git url"
  type        = string
  default     = "https://github.com/GoogleCloudPlatform/professional-services/tree/main/tools/quota-monitoring-alerting/quota-notification"
}

variable "cloud_function_list_project" {
  description = "Value of the name for the Cloud Function to list Project Ids to be scanned"
  type        = string
  default     = "quotaMonitoringListProjects"
}

variable "cloud_function_list_project_desc" {
  description = "Value of the description for the Cloud Function to list Project Ids to be scanned"
  type        = string
  default     = "List Project Ids for the parent node"
}

variable "cloud_function_list_project_memory" {
  description = "Value of the memory for the Cloud Function to list Project Ids to be scanned"
  type        = number
  default     = 512
}

variable "cloud_function_list_project_timeout" {
  description = "Value of the timeout for the Cloud Function to list Project Ids to be scanned"
  type        = number
  default     = 540
}

variable "cloud_function_scan_project" {
  description = "Value of the Name for the Cloud Function to scan Project quotas and load in Big Query"
  type        = string
  default     = "quotaMonitoringScanProjects"
}

variable "cloud_function_scan_project_desc" {
  description = "Value of the description for the Cloud Function to scan Project quotas"
  type        = string
  default     = "Scan Project Quotas for the project Ids received"
}

variable "cloud_function_scan_project_memory" {
  description = "Value of the memory for the Cloud Function to scan Project quotas"
  type        = number
  default     = 512
}

variable "cloud_function_scan_project_timeout" {
  description = "Value of the timeout for the Cloud Function to scan Project quotas"
  type        = number
  default     = 540
}

variable "cloud_function_notification_project" {
  description = "Value of the Name for the Cloud Function to send quota alerts"
  type        = string
  default     = "quotaMonitoringNotification"
}

variable "cloud_function_notification_project_desc" {
  description = "Value of the description for the Cloud Function to send notification"
  type        = string
  default     = "Send notification"
}

variable "cloud_function_notification_project_memory" {
  description = "Value of the memory for the Cloud Function to send notification"
  type        = number
  default     = 512
}

variable "cloud_function_notification_project_timeout" {
  description = "Value of the timeout for the Cloud Function to send notification"
  type        = number
  default     = 540
}

variable "big_query_dataset_id" {
  description = "Value of the Big Query Dataset Id"
  type        = string
  default     = "quota_monitoring_dataset"
}

variable "big_query_dataset_desc" {
  description = "Value of the Big Query Dataset description"
  type        = string
  default     = "Dataset to store quota monitoring data"
}

variable "big_query_dataset_location" {
  description = "Value of the Big Query Dataset location"
  type        = string
  default     = "US"
}

variable "big_query_dataset_default_partition_expiration_ms" {
  description = "Value of the Big Query Dataset default partition expiration"
  type        = number
  default     = 86400000
}

variable "big_query_table_id" {
  description = "Value of the Big Query Table Id"
  type        = string
  default     = "quota_monitoring_table"
}

variable "big_query_table_partition" {
  description = "Value of the Big Query Table time partitioning"
  type        = string
  default     = "DAY"
}

variable "big_query_alert_dataset_id" {
  description = "Value of the Big Query Dataset Id to store alerts"
  type        = string
  default     = "quota_monitoring_notification_dataset"
}

variable "big_query_alert_dataset_desc" {
  description = "Value of the Big Query Alert Dataset description"
  type        = string
  default     = "Dataset to store quota monitoring alert data"
}

variable "big_query_alert_table_id" {
  description = "Value of the Big Query Table Id to store alerts"
  type        = string
  default     = "quota_monitoring_notification_table"
}

variable "bigquery_data_transfer_query_name" {
  description = "Value of the Name Big Query scheduled query to fetch rows where metric usage is >= threshold"
  type        = string
  default     = "extract-quota-usage-alerts"
}

variable "Alert_data_scanning_frequency" {
  description = "Value of Big Query scheduled query frequency to fetch the alerts"
  type        = string
  default     = "every 12 hours"
}

variable "folders" {
  description = "Value of the list of folders to be scanned for quota"
  type        = string
}

variable "organizations" {
  description = "Value of the list of organization Ids to scanned for quota"
  type        = string
}

variable "threshold" {
  description = "Value of threshold for all metrics. If any metric usage >= the threshold, notification will be created"
  type        = string
}

variable "notification_email_address" {
  description = "Email Address to receive email notifications"
  type        = string
}

variable "alert_log_bucket_name" {
  description = "Bucket Name for alert Log Sink (must be globally unique)"
  type        = string
}

variable "log_sink_name" {
  description = "Name for Log Sink"
  type        = string
  default     = "quota-monitoring-sink"
}

variable "retention_days" {
  description = "Log Sink Bucket's retention period in days to detele alert logs"
  type        = number
  default     = 30
}


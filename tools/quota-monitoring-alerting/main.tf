/*
Copyright 20210 Google LLC

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
provider "google" {
  credentials = file("CREDENTIALS_FILE.json")
  #CHANGE - Host project Id
  project     = "marlonpimentel-sandbox"
  #CHANGE - Region same as app engine
  region      = "us-central1"
}

locals {
  #CHANGE - Host Project Id
  home_project                        = "marlonpimentel-sandbox"
  #CHANGE - Region same as app engine
  region                              = "us-central1"
  #CHANGE - Service Account email id to deploy resources and scan project quotas.
  service_account_email               = "sa1-marlonpimentel-sandbox@marlonpimentel-sandbox.iam.gserviceaccount.com"
  #CHANGE - Pub/Sub Topic name to list projects in parent node
  topic_alert_project_id              = "my-topic-id-1"
  #CHANGE - Pub/Sub Topic name to scan project quotas
  topic_alert_project_quota           = "my-topic-id-2"
  #CHANGE - Pub/Sub Topic name to send notification
  topic_alert_notification            = "my-topic-id-3"
  #DO NOT CHANGE - Source code bucket name CHANGE BACK TO ORIGINAL AFTER
  source_code_bucket_name             = "quota-monitoring-solution-marlon"
  #DO NOT CHANGE - Source code for cloud functions list and scan
  source_code_zip                     = "sendAlert-quota-monitoring-solution.zip"
  #DO NOT CHANGE - Source code for cloud functions notification
  source_code_notification_zip        = "alertFeature.zip"
  #CHANGE - Cloud Function name to list projects. Functions in a given region in a given project must have unique (case insensitive) names
  cloud_function_list_project         = "listProjects"
  #CHANGE - Cloud Function name to scan project. CFunctions in a given region in a given project must have unique (case insensitive) names
  cloud_function_scan_project         = "scanProjects"
  #CHANGE - Cloud Function name to scan project. Functions in a given region in a given project must have unique (case insensitive) names
  cloud_function_notification_project = "notification"
  #CHANGE - Big Query Dataset Id
  big_query_dataset_id                = "quota_monitoring_dataset_1"
  #CHANGE - Big Query Table Id
  big_query_table_id                  = "quota_monitoring_table_1"
  #CHANGE - Big Query Alert Dataset Id
  big_query_alert_dataset_id          = "quota_monitoring_alert_dataset_1"
  #CHANGE - Big Query Alert Table Id
  big_query_alert_table_id            = "quota_monitoring_alert_table_1"
  #CHANGE - Dataflow job name
  dataflow_job_name                   = "tf-test-dataflow-job-1"
  #CHANGE - Dataflow job temp bucket. The bucket name must be unique globally.
  dataflow_job_temp_storage           = "dataflow-temp-quota-monitoring-project-1" //name need to be unique
  #CHANGE - Name of the BigQuery scheduled query to generate alert data
  bigquery_data_transfer_query_name   = "extract-quota-usage-alerts"
  #CHANGE - Cron job frequency at Cloud Scheduler
  cron_job_frequency                  = "0 0 * * *"
  #CHANGE - Alert data generation frequency
  Alert_data_scanning_frequency       = "every 15 mins"
  //Input to scan the project quotas
  folders           = "[38659473572]"
  organizations                       = "[172338721810]"
  threshold                           = "80"
}

# Enable Cloud Resource Manager API
module "project-service-cloudresourcemanager" {
source  = "terraform-google-modules/project-factory/google//modules/project_services"
version = "4.0.0"

project_id    = local.home_project

activate_apis = [
"cloudresourcemanager.googleapis.com"
]
}

# Enable APIs
module "project-services" {
source  = "terraform-google-modules/project-factory/google//modules/project_services"
version = "4.0.0"

project_id    = local.home_project

activate_apis = [
"compute.googleapis.com",
"iam.googleapis.com",
"dataflow.googleapis.com",
"monitoring.googleapis.com",
"logging.googleapis.com",
"storage.googleapis.com",
"storage-api.googleapis.com",
"bigquery.googleapis.com",
"pubsub.googleapis.com",
"appengine.googleapis.com",
"cloudscheduler.googleapis.com",
"cloudfunctions.googleapis.com",
"cloudbuild.googleapis.com",
"bigquerydatatransfer.googleapis.com"
]
depends_on = [module.project-service-cloudresourcemanager]
}

# Create Pub/Sub topic to list projects in the parent node
resource "google_pubsub_topic" "topic_alert_project_id" {
name = local.topic_alert_project_id
depends_on = [module.project-services]
}

# Create Pub/Sub topic to scan project quotas
resource "google_pubsub_topic" "topic_alert_project_quota" {
name = local.topic_alert_project_quota
depends_on = [module.project-services]
}

# Create Pub/Sub topic to send notification
resource "google_pubsub_topic" "topic_alert_notification" {
name = local.topic_alert_notification
depends_on = [module.project-services]
}

# Cloud scheduler job to invoke cloud function
resource "google_cloud_scheduler_job" "job" {
name             = "job-terra"
description      = "test http job"
schedule         = local.cron_job_frequency
time_zone        = "America/Chicago"
attempt_deadline = "540s"
region           = local.region
depends_on       = [module.project-services]
retry_config {
retry_count = 1
}

http_target {
http_method = "POST"
uri         = google_cloudfunctions_function.function-listProjects.https_trigger_url
body        = base64encode("{\"organizations\":\"${local.organizations}\",\"threshold\":\"${local.threshold}\",\"projectId\":\"${local.home_project}\"}")

oidc_token {
service_account_email = local.service_account_email
}
}
}

# cloud function to list projects
resource "google_cloudfunctions_function" "function-listProjects" {
name        = local.cloud_function_list_project
description = "My function"
runtime     = "java11"

available_memory_mb   = 4096
source_archive_bucket = local.source_code_bucket_name
source_archive_object = local.source_code_zip
trigger_http          = true
entry_point           = "functions.ListProjects"
service_account_email = local.service_account_email
timeout               = 540
depends_on            = [module.project-services]

environment_variables = {
PUBLISH_TOPIC = google_pubsub_topic.topic_alert_project_id.name
HOME_PROJECT = local.home_project
}
}

# IAM entry for all users to invoke the function
resource "google_cloudfunctions_function_iam_member" "invoker-listProjects" {
project        = google_cloudfunctions_function.function-listProjects.project
region         = google_cloudfunctions_function.function-listProjects.region
cloud_function = google_cloudfunctions_function.function-listProjects.name
depends_on = [module.project-services]

role   = "roles/cloudfunctions.invoker"
member = "serviceAccount:${local.service_account_email}"
}

# Second cloud function to scan project
resource "google_cloudfunctions_function" "function-scanProject" {
name        = local.cloud_function_scan_project
description = "My function"
runtime     = "java11"

available_memory_mb   = 4096
source_archive_bucket = local.source_code_bucket_name
source_archive_object = local.source_code_zip
entry_point           = "functions.ScanProject"
service_account_email = local.service_account_email
timeout               = 540
depends_on            = [module.project-services]

event_trigger {
event_type = "google.pubsub.topic.publish"
resource   = local.topic_alert_project_id
}

environment_variables = {
PUBLISH_TOPIC = google_pubsub_topic.topic_alert_project_quota.name
NOTIFICATION_TOPIC = google_pubsub_topic.topic_alert_notification.name
THRESHOLD = local.threshold
HOME_PROJECT = local.home_project
}
}

# IAM entry for all users to invoke the function
resource "google_cloudfunctions_function_iam_member" "invoker-scanProject" {
project        = google_cloudfunctions_function.function-scanProject.project
region         = google_cloudfunctions_function.function-scanProject.region
cloud_function = google_cloudfunctions_function.function-scanProject.name
depends_on = [module.project-services]

role   = "roles/cloudfunctions.invoker"
member = "serviceAccount:${local.service_account_email}"
}

# Third cloud function to send notification
resource "google_cloudfunctions_function" "function-notificationProject" {
name        = local.cloud_function_notification_project
description = "My function"
runtime     = "java11"

available_memory_mb   = 4096
source_archive_bucket = local.source_code_bucket_name
source_archive_object = local.source_code_notification_zip
entry_point           = "functions.SendNotification"
service_account_email = local.service_account_email
timeout               = 540
depends_on            = [module.project-services]

event_trigger {
event_type = "google.pubsub.topic.publish"
resource   = local.topic_alert_notification
}

environment_variables = {
HOME_PROJECT = local.home_project
ALERT_DATASET = local.big_query_alert_dataset_id
ALERT_TABLE = local.big_query_alert_table_id
}
}

# IAM entry for all users to invoke the function
resource "google_cloudfunctions_function_iam_member" "invoker-notificationProject" {
project        = google_cloudfunctions_function.function-notificationProject.project
region         = google_cloudfunctions_function.function-notificationProject.region
cloud_function = google_cloudfunctions_function.function-notificationProject.name
depends_on = [module.project-services]

role   = "roles/cloudfunctions.invoker"
member = "serviceAccount:${local.service_account_email}"
}

# BigQuery Dataset
resource "google_bigquery_dataset" "dataset" {
dataset_id                      = local.big_query_dataset_id
friendly_name                   = local.big_query_dataset_id
description                     = "This is Quota Monitoring dataset."
location                        = "US"
default_partition_expiration_ms = 86400000
depends_on                      = [module.project-services]
}

# BigQuery Table
resource "google_bigquery_table" "default" {
dataset_id = google_bigquery_dataset.dataset.dataset_id
table_id   = local.big_query_table_id

time_partitioning {
type = "DAY"
}

labels = {
env = "default"
}

schema = <<EOF
[
  {
    "name": "threshold",
    "type": "INT64",
    "mode": "NULLABLE",
    "description": "region"
  },
  {
    "name": "region",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "region"
  },
  {
    "name": "usage",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "current quota usage"
  },
  {
    "name": "limit",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "quota limit"
  },
  {
    "name": "vpc_name",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "vpc name"
  },
  {
    "name": "metric",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "quota metric"
  },
  {
    "name": "addedAt",
    "type": "TIMESTAMP",
    "mode": "NULLABLE",
    "description": "timestamp"
  },
  {
    "name": "project",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "project id"
  },
  {
    "name": "folder_id",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "folder id"
  },
  {
    "name": "value",
    "type": "FLOAT",
    "mode": "NULLABLE",
    "description": "current quota consumption in percent"
  },
  {
    "name": "targetpool_name",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "target pool name"
  },
  {
    "name": "org_id",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "organization id of the project"
  }
]
EOF

}

#Schedule Query to get Alerts data
resource "google_bigquery_data_transfer_config" "query_config" {
display_name           = local.bigquery_data_transfer_query_name
location               = "US"
data_source_id         = "scheduled_query"
schedule               = local.Alert_data_scanning_frequency
notification_pubsub_topic = "projects/${local.home_project}/topics/${local.topic_alert_notification}"
destination_dataset_id = google_bigquery_dataset.quota_usage_alert_dataset.dataset_id
params = {
  destination_table_name_template = "${local.big_query_alert_table_id}"
  write_disposition               = "WRITE_TRUNCATE"
  query                           = "SELECT *  FROM `${local.home_project}.${google_bigquery_dataset.dataset.dataset_id}.${google_bigquery_table.default.table_id}` WHERE  CAST(usage as NUMERIC) >= threshold"
}
}

#Bigquery Alert Dataset
resource "google_bigquery_dataset" "quota_usage_alert_dataset" {
dataset_id    = "${local.big_query_alert_dataset_id}"
friendly_name = "quota_usage_alert_dataset"
description   = "quota_usage_alert_dataset"
location      = "US"
depends_on    = [module.project-services]
}

# DataFlow job temp GCS bucket
resource "google_storage_bucket" "dataflow_temp_storage_bucket" {
name                        = local.dataflow_job_temp_storage
uniform_bucket_level_access = true
depends_on                  = [module.project-services]
}

# Dataflow job temp folder in the GCS bucket
resource "google_storage_bucket_object" "temp" {
name   = "temp/"
content = "Not really a directory, but it's empty."
bucket = local.dataflow_job_temp_storage
depends_on = [google_storage_bucket.dataflow_temp_storage_bucket]
}

# DataFlow job
resource "google_dataflow_job" "pubsub_stream" {
name                  = local.dataflow_job_name
template_gcs_path     = "gs://dataflow-templates-us-central1/latest/PubSub_to_BigQuery"
temp_gcs_location     = "gs://${local.dataflow_job_temp_storage}/temp"
region                = local.region
service_account_email = local.service_account_email
depends_on            = [google_storage_bucket_object.temp]
parameters = {
inputTopic      = "projects/${local.home_project}/topics/${local.topic_alert_project_quota}"
outputTableSpec = "${local.home_project}:${google_bigquery_dataset.dataset.dataset_id}.${google_bigquery_table.default.table_id}"
}
}

# Custom log-based metric to send quota alert data through
resource "google_logging_metric" "quota_logging_metric" {
  name   = "resource_usage"
  description = "Tracks a log containing resources' quota data"
  filter = "logName=\"projects/${local.home_project}/logs/quota-alerts\""
  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
    labels {
      key = "data"
      value_type = "STRING"
    }
  }
  label_extractors = {
    "data" = "EXTRACT(textPayload)"
  }
}

#Set notification channels below
#Add Notification channel - Email
resource "google_monitoring_notification_channel" "email0" {
  display_name = "Oncall"
  type = "email"
  labels = {
    email_address = "marlonpimentel@google.com"
  }
}

#Info inside the sensitive_labels property is hidden from the plan output
#Add Notification channel - Slack - supply channel_name & auth_token
#resource "google_monitoring_notification_channel" "slackChannel" {
#  display_name = "Test Slack Channel"
#  type         = "slack"
#  labels = {
#    "channel_name" = "#quota-monitoring-solution"
#  }
#  sensitive_labels {
#    auth_token = "xoxb-2005437637463-2017215922085-WBF8WJgQHUVoywIe0kOv8zND"
#  }
#}

#Add Notification channel - PagerDuty - supply service_key token 
#resource "google_monitoring_notification_channel" "pagerDuty" {
#  display_name = "PagerDuty Services"
#  type         = "pagerduty"
#  labels = {
#    "channel_name" = "#foobar"
#  }
#  sensitive_labels {
#    service_key = "one"
#  }
#}

#Email notification channel 1 output
output "email0_id" {
  value = "${google_monitoring_notification_channel.email0.name}"
}

#Alert policy for log-based metric
# Condition display name can be changed based on user's quota range
resource "google_monitoring_alert_policy" "alert_policy_quota" {
  display_name = "Resources reaching Quotas"
  combiner = "OR"
  conditions {
    display_name = "Resources reaching Quotas"
    condition_threshold { 
      filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.quota_logging_metric.name}\" resource.type=\"global\""
      duration = "60s"
      comparison = "COMPARISON_GT"
      threshold_value = 0
      trigger {
          count = 1
      }
      aggregations {
        per_series_aligner = "ALIGN_COUNT"
        alignment_period = "60s"
      }
    }
  }
  documentation {
    mime_type = "text/markdown"
    content = "$${metric.label.data}"
  }
  notification_channels = [
    "${google_monitoring_notification_channel.email0.name}"
  ]
} 

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
  credentials = file(var.credentials)
  #CHANGE - Host project Id
  project = var.home_project
  #CHANGE - Region same as app engine
  region = var.region
}

locals {
  #DO NOT CHANGE - Source code bucket name CHANGE BACK TO ORIGINAL AFTER
  source_code_bucket_name = "quota-monitoring-solution-marlon"
  #DO NOT CHANGE - Source code for cloud functions list and scan
  source_code_zip = "sendAlert-quota-monitoring-solution.zip"
  #DO NOT CHANGE - Source code for cloud functions notification
  source_code_notification_zip = "alertDir.zip"
}

# Enable Cloud Resource Manager API
module "project-service-cloudresourcemanager" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "4.0.0"

  project_id = var.home_project

  activate_apis = [
    "cloudresourcemanager.googleapis.com"
  ]
}

# Enable APIs
module "project-services" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "4.0.0"

  project_id = var.home_project

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
  name       = var.topic_alert_project_id
  depends_on = [module.project-services]
}

# Create Pub/Sub topic to scan project quotas
resource "google_pubsub_topic" "topic_alert_project_quota" {
  name       = var.topic_alert_project_quota
  depends_on = [module.project-services]
}

# Create Pub/Sub topic to send notification
resource "google_pubsub_topic" "topic_alert_notification" {
  name       = var.topic_alert_notification
  depends_on = [module.project-services]
}

# Cloud scheduler job to invoke cloud function
resource "google_cloud_scheduler_job" "job" {
  name             = "job-terra"
  description      = "test http job"
  schedule         = var.cron_job_frequency
  time_zone        = "America/Chicago"
  attempt_deadline = "540s"
  region           = var.region
  depends_on       = [module.project-services]
  retry_config {
    retry_count = 1
  }

  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions_function.function-listProjects.https_trigger_url
    body        = base64encode("{\"organizations\":\"${var.organizations}\",\"threshold\":\"${var.threshold}\",\"projectId\":\"${var.home_project}\"}")

    oidc_token {
      service_account_email = var.service_account_email
    }
  }
}

# cloud function to list projects
resource "google_cloudfunctions_function" "function-listProjects" {
  name        = var.cloud_function_list_project
  description = "Function to list projects"
  runtime     = "java11"

  available_memory_mb   = 4096
  source_archive_bucket = local.source_code_bucket_name
  source_archive_object = local.source_code_zip
  trigger_http          = true
  entry_point           = "functions.ListProjects"
  service_account_email = var.service_account_email
  timeout               = 540
  depends_on            = [module.project-services]

  environment_variables = {
    PUBLISH_TOPIC = google_pubsub_topic.topic_alert_project_id.name
    HOME_PROJECT  = var.home_project
  }
}

# IAM entry for all users to invoke the function
resource "google_cloudfunctions_function_iam_member" "invoker-listProjects" {
  project        = google_cloudfunctions_function.function-listProjects.project
  region         = google_cloudfunctions_function.function-listProjects.region
  cloud_function = google_cloudfunctions_function.function-listProjects.name
  depends_on     = [module.project-services]

  role   = "roles/cloudfunctions.invoker"
  member = "serviceAccount:${var.service_account_email}"
}

# Second cloud function to scan project
resource "google_cloudfunctions_function" "function-scanProject" {
  name        = var.cloud_function_scan_project
  description = "Function to scan quota metrics in a Project"
  runtime     = "java11"

  available_memory_mb   = 4096
  source_archive_bucket = local.source_code_bucket_name
  source_archive_object = local.source_code_zip
  entry_point           = "functions.ScanProject"
  service_account_email = var.service_account_email
  timeout               = 540
  depends_on            = [module.project-services]

  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = var.topic_alert_project_id
  }

  environment_variables = {
    PUBLISH_TOPIC      = google_pubsub_topic.topic_alert_project_quota.name
    NOTIFICATION_TOPIC = google_pubsub_topic.topic_alert_notification.name
    THRESHOLD          = var.threshold
    HOME_PROJECT       = var.home_project
  }
}

# IAM entry for all users to invoke the function
resource "google_cloudfunctions_function_iam_member" "invoker-scanProject" {
  project        = google_cloudfunctions_function.function-scanProject.project
  region         = google_cloudfunctions_function.function-scanProject.region
  cloud_function = google_cloudfunctions_function.function-scanProject.name
  depends_on     = [module.project-services]

  role   = "roles/cloudfunctions.invoker"
  member = "serviceAccount:${var.service_account_email}"
}

# Third cloud function to send notification
resource "google_cloudfunctions_function" "function-notificationProject" {
  name        = var.cloud_function_notification_project
  description = "Function to send notifications"
  runtime     = "java11"

  available_memory_mb   = 4096
  source_archive_bucket = local.source_code_bucket_name
  source_archive_object = local.source_code_notification_zip
  entry_point           = "functions.SendNotification"
  service_account_email = var.service_account_email
  timeout               = 540
  depends_on            = [module.project-services]

  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = var.topic_alert_notification
  }

  environment_variables = {
    HOME_PROJECT  = var.home_project
    ALERT_DATASET = var.big_query_alert_dataset_id
    ALERT_TABLE   = var.big_query_alert_table_id
  }
}

# IAM entry for all users to invoke the function
resource "google_cloudfunctions_function_iam_member" "invoker-notificationProject" {
  project        = google_cloudfunctions_function.function-notificationProject.project
  region         = google_cloudfunctions_function.function-notificationProject.region
  cloud_function = google_cloudfunctions_function.function-notificationProject.name
  depends_on     = [module.project-services]

  role   = "roles/cloudfunctions.invoker"
  member = "serviceAccount:${var.service_account_email}"
}

# BigQuery Dataset
resource "google_bigquery_dataset" "dataset" {
  dataset_id                      = var.big_query_dataset_id
  friendly_name                   = var.big_query_dataset_id
  description                     = "This is Quota Monitoring dataset."
  location                        = "US"
  default_partition_expiration_ms = 86400000
  depends_on                      = [module.project-services]
}

# BigQuery Table
resource "google_bigquery_table" "default" {
  dataset_id = google_bigquery_dataset.dataset.dataset_id
  table_id   = var.big_query_table_id

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
  display_name              = var.bigquery_data_transfer_query_name
  location                  = "US"
  data_source_id            = "scheduled_query"
  schedule                  = var.alert_data_scanning_frequency
  notification_pubsub_topic = "projects/${var.home_project}/topics/${var.topic_alert_notification}"
  destination_dataset_id    = google_bigquery_dataset.quota_usage_alert_dataset.dataset_id
  params = {
    destination_table_name_template = var.big_query_alert_table_id
    write_disposition               = "WRITE_TRUNCATE"
    query                           = "SELECT *  FROM `${var.home_project}.${google_bigquery_dataset.dataset.dataset_id}.${google_bigquery_table.default.table_id}` WHERE value >= 1"
  }
}

#Bigquery Alert Dataset
resource "google_bigquery_dataset" "quota_usage_alert_dataset" {
  dataset_id    = var.big_query_alert_dataset_id
  friendly_name = "quota_usage_alert_dataset"
  description   = "quota_usage_alert_dataset"
  location      = "US"
  depends_on    = [module.project-services]
}

# DataFlow job temp GCS bucket
resource "google_storage_bucket" "dataflow_temp_storage_bucket" {
  name                        = var.dataflow_job_temp_storage
  uniform_bucket_level_access = true
  depends_on                  = [module.project-services]
}

# Dataflow job temp folder in the GCS bucket
resource "google_storage_bucket_object" "temp" {
  name       = "temp/"
  content    = "Not really a directory, but it's empty."
  bucket     = var.dataflow_job_temp_storage
  depends_on = [google_storage_bucket.dataflow_temp_storage_bucket]
}

# DataFlow job
resource "google_dataflow_job" "pubsub_stream" {
  name                  = var.dataflow_job_name
  template_gcs_path     = "gs://dataflow-templates-us-central1/latest/PubSub_to_BigQuery"
  temp_gcs_location     = "gs://${var.dataflow_job_temp_storage}/temp"
  region                = var.region
  service_account_email = var.service_account_email
  depends_on            = [google_storage_bucket_object.temp]
  parameters = {
    inputTopic      = "projects/${var.home_project}/topics/${var.topic_alert_project_quota}"
    outputTableSpec = "${var.home_project}:${google_bigquery_dataset.dataset.dataset_id}.${google_bigquery_table.default.table_id}"
  }
}

# Custom log-based metric to send quota alert data through
resource "google_logging_metric" "quota_logging_metric" {
  name        = "resource_usage"
  description = "Tracks a log containing resources' quota data"
  filter      = "logName=\"projects/${var.home_project}/logs/quota-alerts\""
  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
    labels {
      key        = "data"
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
  type         = "email"
  labels = {
    email_address = var.notification_email_address
  }
}


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
  value = google_monitoring_notification_channel.email0.name
}

#Log sink to route logs to log bucket
resource "google_logging_project_sink" "instance-sink" {
  name                   = var.log_sink_name
  description            = "Log sink to route logs sent by the Notification cloud function to the designated log bucket"
  destination            = "logging.googleapis.com/projects/${var.home_project}/locations/global/buckets/${var.log_bucket_name}"
  filter                 = "logName=\"projects/${var.home_project}/logs/quota-alerts\""
  unique_writer_identity = true
}

#Because our sink uses a unique_writer, we must grant that writer access to the bucket.
resource "google_project_iam_binding" "log-writer" {
  role = "roles/logging.configWriter"

  members = [
    "serviceAccount:${var.service_account_email}",
  ]
}

#Log bucket to store logs
resource "google_logging_project_bucket_config" "logging_bucket" {
  project        = var.home_project
  location       = "global"
  retention_days = var.retention_days
  bucket_id      = var.log_bucket_name
  description    = "Log bucket to store logs related to quota alerts sent by the Notification cloud function"
}

#Alert policy for log-based metric
# Condition display name can be changed based on user's quota range
resource "google_monitoring_alert_policy" "alert_policy_quota" {
  display_name = "Resources reaching Quotas"
  combiner     = "OR"
  conditions {
    display_name = "Resources reaching Quotas"
    condition_threshold {
      filter          = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.quota_logging_metric.name}\" resource.type=\"global\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      trigger {
        count = 1
      }
      aggregations {
        per_series_aligner = "ALIGN_COUNT"
        alignment_period   = "60s"
      }
    }
  }
  documentation {
    mime_type = "text/markdown"
    content   = "$${metric.label.data}"
  }
  notification_channels = [
    google_monitoring_notification_channel.email0.name
  ]
}

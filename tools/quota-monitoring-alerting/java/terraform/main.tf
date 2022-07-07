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
provider "google" {
  credentials = file("../CREDENTIALS_FILE.json")
  project     = var.project_id
  region      = var.region
}

# Enable Cloud Resource Manager API
module "project-service-cloudresourcemanager" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "4.0.0"

  project_id = var.project_id

  activate_apis = [
    "cloudresourcemanager.googleapis.com"
  ]
}

# Enable APIs
module "project-services" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "4.0.0"

  project_id = var.project_id

  activate_apis = [
    "compute.googleapis.com",
    "iam.googleapis.com",
    "monitoring.googleapis.com",
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

# Create Pub/Sub topic to send notification
resource "google_pubsub_topic" "topic_alert_notification" {
  name       = var.topic_alert_notification
  depends_on = [module.project-services]
}

# Cloud scheduler job to invoke cloud function
resource "google_cloud_scheduler_job" "job" {
  name             = var.scheduler_cron_job_name
  description      = var.scheduler_cron_job_description
  schedule         = var.scheduler_cron_job_frequency
  time_zone        = var.scheduler_cron_job_timezone
  attempt_deadline = var.scheduler_cron_job_deadline
  region           = var.region
  depends_on       = [module.project-services]
  retry_config {
    retry_count = 1
  }

  http_target {
    http_method = "POST"
    uri         = google_cloudfunctions_function.function-listProjects.https_trigger_url
    body        = base64encode("{\"organizations\":\"${var.organizations}\",\"threshold\":\"${var.threshold}\",\"projectId\":\"${var.project_id}\"}")

    oidc_token {
      service_account_email = var.service_account_email
    }
  }
}

# cloud function to list projects
resource "google_cloudfunctions_function" "function-listProjects" {
  name        = var.cloud_function_list_project
  description = var.cloud_function_list_project_desc
  runtime     = "java11"

  available_memory_mb   = var.cloud_function_list_project_memory
  source_archive_bucket = var.source_code_bucket_name
  source_archive_object = var.source_code_zip
  trigger_http          = true
  entry_point           = "functions.ListProjects"
  service_account_email = var.service_account_email
  timeout               = var.cloud_function_list_project_timeout
  depends_on            = [module.project-services]

  environment_variables = {
    PUBLISH_TOPIC = google_pubsub_topic.topic_alert_project_id.name
    HOME_PROJECT  = var.project_id
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
  description = var.cloud_function_scan_project_desc
  runtime     = "java11"

  available_memory_mb   = var.cloud_function_scan_project_memory
  source_archive_bucket = var.source_code_bucket_name
  source_archive_object = var.source_code_zip
  entry_point           = "functions.ScanProjectQuotas"
  service_account_email = var.service_account_email
  timeout               = var.cloud_function_scan_project_timeout
  depends_on            = [module.project-services]

  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = var.topic_alert_project_id
  }

  environment_variables = {
    NOTIFICATION_TOPIC = google_pubsub_topic.topic_alert_notification.name
    THRESHOLD          = var.threshold
    BIG_QUERY_DATASET  = var.big_query_dataset_id
    BIG_QUERY_TABLE    = var.big_query_table_id
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
  description = var.cloud_function_notification_project_desc
  runtime     = "java11"

  available_memory_mb   = var.cloud_function_notification_project_memory
  source_archive_bucket = var.source_code_bucket_name
  source_archive_object = var.source_code_notification_zip
  entry_point           = "functions.SendNotification"
  service_account_email = var.service_account_email
  timeout               = var.cloud_function_notification_project_timeout
  depends_on            = [module.project-services]

  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = var.topic_alert_notification
  }

  environment_variables = {
    HOME_PROJECT  = var.project_id
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
  description                     = var.big_query_dataset_desc
  location                        = var.big_query_dataset_location
  default_partition_expiration_ms = var.big_query_dataset_default_partition_expiration_ms
  depends_on                      = [module.project-services]
}

# BigQuery Table
resource "google_bigquery_table" "default" {
  dataset_id = google_bigquery_dataset.dataset.dataset_id
  table_id   = var.big_query_table_id

  time_partitioning {
    type = var.big_query_table_partition
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
    "name": "m_value",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "Quota metric value - usage or limit"
  },
  {
    "name": "mv_type",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": "Type of metric value - usage or limit"
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
    "name": "project_id",
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
  location                  = var.big_query_dataset_location
  data_source_id            = "scheduled_query"
  schedule                  = var.Alert_data_scanning_frequency
  notification_pubsub_topic = "projects/${var.project_id}/topics/${var.topic_alert_notification}"
  destination_dataset_id    = google_bigquery_dataset.quota_usage_alert_dataset.dataset_id
  depends_on                = [module.project-services]
  params = {
    destination_table_name_template = var.big_query_alert_table_id
    write_disposition               = "WRITE_TRUNCATE"
    query                           = "SELECT metric,usage,q_limit,consumption,project_id,region,HOUR AS addedAt FROM (SELECT project_id,region,metric,HOUR,q_limit,usage,ROUND((SAFE_DIVIDE(CAST(t.usage AS BIGNUMERIC),CAST(t.q_limit AS BIGNUMERIC))*100),2) AS consumption,threshold FROM (SELECT project_id,region,metric,DATE_TRUNC(addedAt, HOUR) AS HOUR,MAX(CASE WHEN mv_type='limit' THEN m_value ELSE NULL END) AS q_limit,MAX(CASE WHEN mv_type='usage' THEN m_value ELSE NULL END) AS usage,threshold FROM ${var.project_id}.${google_bigquery_dataset.dataset.dataset_id}.${google_bigquery_table.default.table_id} GROUP BY 1,2,3,4,7 ) t ) c WHERE c.consumption >= c.threshold"
  }
}

#Bigquery Alert Dataset
resource "google_bigquery_dataset" "quota_usage_alert_dataset" {
  dataset_id    = var.big_query_alert_dataset_id
  friendly_name = "quota_usage_alert_dataset"
  description   = var.big_query_alert_dataset_desc
  location      = var.big_query_dataset_location
  depends_on    = [module.project-services]
}


# Custom log-based metric to send quota alert data through
resource "google_logging_metric" "quota_logging_metric" {
  name        = "resource_usage"
  description = "Tracks logs for quota usage above threshold"
  filter      = "logName:\"projects/${var.project_id}/logs/\" jsonPayload.message:\"|ProjectId | Scope |\""
  depends_on  = [module.project-services]
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
    "data" = "EXTRACT(jsonPayload.message)"
  }
}

#Set notification channels below
#Add Notification channel - Email
resource "google_monitoring_notification_channel" "email0" {
  display_name = "Oncall"
  type         = "email"
  depends_on   = [module.project-services]
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
  destination            = "logging.googleapis.com/projects/${var.project_id}/locations/global/buckets/${var.alert_log_bucket_name}"
  filter                 = "logName=\"projects/${var.project_id}/logs/quota-alerts\""
  unique_writer_identity = true
  depends_on             = [module.project-services]
}

#Because our sink uses a unique_writer, we must grant that writer access to the bucket.
resource "google_project_iam_binding" "log-writer" {
  project    = var.project_id
  role       = "roles/logging.configWriter"
  depends_on = [module.project-services]
  members = [
    "serviceAccount:${var.service_account_email}",
  ]
}

#Log bucket to store logs
resource "google_logging_project_bucket_config" "logging_bucket" {
  project        = var.project_id
  location       = "global"
  retention_days = var.retention_days
  bucket_id      = var.alert_log_bucket_name
  description    = "Log bucket to store logs related to quota alerts sent by the Notification cloud function"
  depends_on     = [module.project-services]
}

#Alert policy for log-based metric
# Condition display name can be changed based on user's quota range
resource "google_monitoring_alert_policy" "alert_policy_quota" {
  display_name = "Resources reaching Quotas"
  combiner     = "OR"
  conditions {
    display_name = "Resources reaching Quotas"
    condition_threshold {
      filter          = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.quota_logging_metric.name}\"  AND resource.type=\"cloud_function\""
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
  depends_on = [module.project-services]
}

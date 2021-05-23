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
    "dataflow.googleapis.com",
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
  entry_point           = "functions.ScanProject"
  service_account_email = var.service_account_email
  timeout               = var.cloud_function_scan_project_timeout
  depends_on            = [module.project-services]

  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = var.topic_alert_project_id
  }

  environment_variables = {
    PUBLISH_TOPIC      = google_pubsub_topic.topic_alert_project_quota.name
    NOTIFICATION_TOPIC = google_pubsub_topic.topic_alert_notification.name
    THRESHOLD          = var.threshold
    HOME_PROJECT       = var.project_id
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
    SENDGRID_API_KEY = var.SENDGRID_API_KEY
    FROM_EMAIL_ID    = var.fromEmailId
    TO_EMAIL_IDS     = var.toEmailIds
    HOME_PROJECT     = var.project_id
    ALERT_DATASET    = var.big_query_alert_dataset_id
    ALERT_TABLE      = var.big_query_alert_table_id
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
  location                  = var.big_query_dataset_location
  data_source_id            = "scheduled_query"
  schedule                  = var.Alert_data_scanning_frequency
  notification_pubsub_topic = "projects/${var.project_id}/topics/${var.topic_alert_notification}"
  destination_dataset_id    = google_bigquery_dataset.quota_usage_alert_dataset.dataset_id
  params = {
    destination_table_name_template = var.big_query_alert_table_id
    write_disposition               = "WRITE_TRUNCATE"
    query                           = "SELECT *  FROM `${var.project_id}.${google_bigquery_dataset.dataset.dataset_id}.${google_bigquery_table.default.table_id}` WHERE  CAST(usage as NUMERIC) >= threshold"
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

# DataFlow job temp GCS bucket
resource "google_storage_bucket" "dataflow_temp_storage_bucket" {
  name                        = var.dataflow_job_temp_storage
  uniform_bucket_level_access = true
  depends_on                  = [module.project-services]
}

# Dataflow job temp folder in the GCS bucket
resource "google_storage_bucket_object" "temp" {
  name       = "temp/"
  content    = "Not a directory, it's empty."
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
    inputTopic      = "projects/${var.project_id}/topics/${var.topic_alert_project_quota}"
    outputTableSpec = "${var.project_id}:${google_bigquery_dataset.dataset.dataset_id}.${google_bigquery_table.default.table_id}"
  }
}
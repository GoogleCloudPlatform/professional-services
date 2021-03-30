/*
 * Copyright 2021 Google LLC. This software is provided as-is, without warranty
 * or representation for any use or purpose. Your use of it is subject to your 
 * agreement with Google.  
 */
resource "google_cloudfunctions_function" "net_logs" {
  project     = google_project.demo_project.project_id
  name        = "net_logs"
  entry_point = "main"
  description = "Enables network logs whenever a subnet is created or modified."
  runtime     = "python37"
  region      = "europe-west1"

  service_account_email = google_service_account.net_logs_cf.email
  source_archive_bucket = google_storage_bucket.cloud_function.name
  source_archive_object = google_storage_bucket_object.cloud_function.name
  event_trigger {
    event_type = "providers/cloud.pubsub/eventTypes/topic.publish"
    resource   = google_pubsub_topic.subnet_change.id
    failure_policy {
      # enable retry, since the function may be called before the subnet is ready
      # to be updated.
      retry = true
    }
  }

  environment_variables = {
    LOG_CONFIG = jsonencode(var.log_config)
  }

  depends_on = [google_project_service.demo_project]
}

# Push the zip file containing the cloud function to the bucket
resource "google_storage_bucket_object" "cloud_function" {
  name   = "net_logs.zip"
  source = data.archive_file.cloud_function.output_path
  bucket = google_storage_bucket.cloud_function.name
}

# GCS bucket to store the clouf function code
resource "google_storage_bucket" "cloud_function" {
  name                        = "${google_project.demo_project.project_id}-cf${local.suffix_dash}"
  project                     = google_project.demo_project.project_id
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true
  storage_class               = "REGIONAL"
  depends_on                  = [google_project_service.demo_project]
}

# Create a ZIP file with the cloud function. This file will be uploaded to a 
# GCS bucket, so it can be published as a Cloud function.
data "archive_file" "cloud_function" {
  type        = "zip"
  output_path = "templates/cloud_function.zip"
  source_dir  = "templates/cloud_function"
}
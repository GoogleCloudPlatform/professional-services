/*
 * Copyright 2021 Google LLC. This software is provided as-is, without warranty
 * or representation for any use or purpose. Your use of it is subject to your 
 * agreement with Google.  
 */

# Create the Pub/Sub topic where the subnet change logs will be sent.
resource "google_pubsub_topic" "subnet_change" {
  project = google_project.demo_project.project_id
  name    = "subnet-changes"
}

# Allow publishing rights to the log sink service accounts (if enabled).
resource "google_pubsub_topic_iam_member" "log_sink" {
  count   = length(google_logging_folder_sink.subnet_change.*) * ((var.configure_log_sinks && !var.configure_asset_feeds) ? 1 : 0)
  project = google_project.demo_project.project_id
  topic   = google_pubsub_topic.subnet_change.id
  role    = "roles/pubsub.publisher"
  member  = google_logging_folder_sink.subnet_change[count.index].writer_identity
}

# Allow publishing rights to the asset inventory service account (if enabled).
resource "google_pubsub_topic_iam_member" "cai_notifier" {
  count   = (var.configure_asset_feeds ? 1 : 0)
  project = google_project.demo_project.project_id
  topic   = google_pubsub_topic.subnet_change.id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:service-${google_project.demo_project.number}@gcp-sa-cloudasset.iam.gserviceaccount.com"
  depends_on = [
    google_cloud_asset_folder_feed.subnet_change[0],
  ]
}
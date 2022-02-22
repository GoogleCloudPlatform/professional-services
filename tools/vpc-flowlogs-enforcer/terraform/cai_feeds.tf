/*
 * Copyright 2021 Google LLC. This software is provided as-is, without warranty
 * or representation for any use or purpose. Your use of it is subject to your 
 * agreement with Google.  
 */

# Create a feed that sends notifications about subnetwork resource updates under the
# chosen folders.
resource "google_cloud_asset_folder_feed" "subnet_change" {
  count           = length(var.enforcement_folders) * (var.configure_asset_feeds ? 1 : 0)
  billing_project = google_project.demo_project.project_id
  folder          = var.enforcement_folders[count.index]
  feed_id         = "subnet_change"
  content_type    = "RESOURCE"

  asset_types = [
    "compute.googleapis.com/Subnetwork",
  ]

  feed_output_config {
    pubsub_destination {
      topic = google_pubsub_topic.subnet_change.id
    }
  }

  depends_on = [
    google_project_service.demo_project["cloudasset.googleapis.com"],
  ]
}

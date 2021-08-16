/*
 * Copyright 2021 Google LLC. This software is provided as-is, without warranty
 * or representation for any use or purpose. Your use of it is subject to your 
 * agreement with Google.  
 */

# Service account attached to the cloud function that enables network logging.
# We'll need to grant this SA certain permissions on the folders where the subnet
# logs will be enforced.
resource "google_service_account" "net_logs_cf" {
  project      = google_project.demo_project.project_id
  account_id   = "net-logs-cf"
  display_name = "Network log enabler Cloud Function"
}
/*
 * Copyright 2021 Google LLC. This software is provided as-is, without warranty
 * or representation for any use or purpose. Your use of it is subject to your 
 * agreement with Google.  
 */

output "project_id" {
  value = google_project.demo_project.project_id
}

output "pubsub_topic" {
  value = google_pubsub_topic.subnet_change.id
}
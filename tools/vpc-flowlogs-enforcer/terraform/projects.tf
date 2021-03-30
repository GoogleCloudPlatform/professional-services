/*
 * Copyright 2021 Google LLC. This software is provided as-is, without warranty
 * or representation for any use or purpose. Your use of it is subject to your 
 * agreement with Google.  
 */

resource "google_project" "demo_project" {
  name            = var.project_id
  folder_id       = var.root_folder_id
  billing_account = var.gcp_billing_account_id
  project_id      = "${var.project_id}${local.suffix_dash}"
}

# services to enable in the demo project
resource "google_project_service" "demo_project" {
  for_each           = toset(var.gcp_services)
  project            = google_project.demo_project.project_id
  service            = each.value
  disable_on_destroy = false
}
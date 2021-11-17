// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

locals {
  apis = [ "iam.googleapis.com", "run.googleapis.com", "compute.googleapis.com", "pubsub.googleapis.com", "cloudasset.googleapis.com", "cloudresourcemanager.googleapis.com", "securitycenter.googleapis.com"]
}


data "google_project" "project" {
  project_id = var.project_id
}

resource "google_project_service" "project" {
  for_each = toset(local.apis)
  project = data.google_project.project.project_id
  service = each.key

  //disable_dependent_services = true
  disable_on_destroy = false
}

data "google_organization" "org" {
    organization = "organizations/${var.organization_id}"
}

resource "google_service_account" "autopilot" {
  account_id = "ipam-autopilot-sa"
  display_name = "Service Account for the IPAM Autopilot"
  depends_on = [
    google_project_service.project
  ]
}

resource "google_organization_iam_member" "service_account_roles" {
  for_each = toset([
    "roles/securitycenter.controlServiceAgent"
  ])

  org_id = data.google_organization.org.org_id
  role = each.value
  member = "serviceAccount:${google_service_account.autopilot.email}"
}


resource "google_scc_source" "autopilot_source" {
  display_name = "IPAM Autopilot"
  organization = data.google_organization.org.org_id
  description  = "A custom scanner for listening to subnet creations"

  depends_on = [
    google_project_service.project
  ]
}

resource "google_cloud_asset_organization_feed" "organization_feed" {
  billing_project = var.project_id
  org_id          = data.google_organization.org.org_id
  feed_id         = google_pubsub_topic.feed_output.name
  content_type    = "RESOURCE"

  asset_types = [
    "compute.googleapis.com/Subnetwork"
  ]

  feed_output_config {
    pubsub_destination {
      topic = google_pubsub_topic.feed_output.id
    }
  }
}

resource "google_pubsub_topic" "feed_output" {
  name     = "ipam_changes"

  depends_on = [
    google_project_service.project
  ]
}

resource "google_pubsub_topic_iam_member" "cloud_asset_writer" {
  project = var.project_id
  topic   = google_pubsub_topic.feed_output.id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-cloudasset.iam.gserviceaccount.com"
}
#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
terraform {
  required_version = ">= 1.0.0"
}

provider "google" {
  project = var.project_id
}

locals {
  project_roles = [
    "roles/editor",
    "roles/recommender.bigQueryCapacityCommitmentsViewer",
    "roles/recommender.cloudAssetInsightsViewer",
    "roles/recommender.cloudsqlViewer",
    "roles/recommender.computeViewer",
    "roles/recommender.firewallViewer",
    "roles/recommender.iamViewer",
    "roles/recommender.productSuggestionViewer",
    "roles/recommender.projectCudViewer",
    "roles/recommender.projectUtilViewer",
    "roles/cloudasset.viewer"
  ]
  apis = [
    "bigquery.googleapis.com",
    "storage.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "recommender.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "cloudasset.googleapis.com",
    "billingbudgets.googleapis.com",
    "cloudidentity.googleapis.com",
    "admin.googleapis.com",
    "pubsub.googleapis.com",
    "iam.googleapis.com"
  ]
}

resource "random_id" "random" {
  byte_length = 8
}

resource "google_storage_bucket" "bucket" {
  name          = format("pubsub2inbox-test-%s", random_id.random.hex)
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  depends_on = [
    google_project_service.apis["storage.googleapis.com"]
  ]
}

resource "google_service_account" "sa" {
  account_id   = format("sa-%s", random_id.random.hex)
  display_name = "Pubsub2Inbox Test Service Account"

  depends_on = [
    google_project_service.apis["iam.googleapis.com"]
  ]
}

resource "google_service_account_key" "sa-key" {
  service_account_id = google_service_account.sa.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

resource "google_project_iam_member" "sa-iam" {
  for_each = toset(local.project_roles)
  project  = var.project_id
  role     = each.value
  member   = format("serviceAccount:%s", google_service_account.sa.email)

  depends_on = [
    google_project_service.apis["iam.googleapis.com"]
  ]
}

resource "google_project_service" "apis" {
  for_each = toset(local.apis)
  project  = var.project_id
  service  = each.value

  disable_on_destroy = false
}


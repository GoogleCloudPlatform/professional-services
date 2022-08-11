
# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


module "nfs-api" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "10.1.1"

  project_id = var.project_id
  activate_apis = [
    "cloudvolumesgcp-api.netapp.com",
    "serviceusage.googleapis.com"
  ]
}

resource "google_service_account" "service_account" {
  project      = var.project_id
  account_id   = "nfs-sa"
  display_name = "nfs service account"
}

resource "google_project_iam_member" "roles" {
  project = google_service_account.service_account.project
  # for_each = toset(var.roles)
  role   = "roles/netappcloudvolumes.admin"
  member = "serviceAccount:${google_service_account.service_account.email}"
}

resource "google_service_account_key" "nfs-key" {
  service_account_id = google_service_account.service_account.account_id

  depends_on = [
    google_service_account.service_account
  ]
}
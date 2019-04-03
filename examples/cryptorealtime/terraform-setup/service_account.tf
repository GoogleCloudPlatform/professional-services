# Copyright 2019 Google LLC
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

resource "google_service_account" "vmaccess" {
  project = "${var.project_id}"
  account_id = "vmaccess"
  display_name = "My Tutorial VM access"
}

resource "google_project_iam_member" "bigtable_role" {
  project = "${var.project_id}"
  role = "roles/bigtable.admin"
  member = "serviceAccount:${google_service_account.vmaccess.email}"
}

resource "google_project_iam_member" "dataflow_role" {
  project = "${var.project_id}"
  role = "roles/dataflow.admin"
  member = "serviceAccount:${google_service_account.vmaccess.email}"
}

resource "google_project_iam_member" "storage_role" {
  project = "${var.project_id}"
  role = "roles/storage.admin"
  member = "serviceAccount:${google_service_account.vmaccess.email}"
}

resource "google_project_iam_member" "compute_role" {
  project = "${var.project_id}"
  role = "roles/compute.admin"
  member = "serviceAccount:${google_service_account.vmaccess.email}"
}


output "vmaccess service account" {
  value = "${google_service_account.vmaccess.email}"
}


# Copyright 2022 Google LLC
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

// Query current Google Cloud project metadata
data "google_project" "default" {}

// Provision a service account that will be bound to the Dataflow pipeline
resource "google_service_account" "dataflow_runner" {
  account_id   = "dataflow-runner"
  display_name = "dataflow-runner"
  description  = "The service account bound to the compute engine instance provisioned to run Dataflow Jobs"
}

// Provision IAM roles for the Dataflow runner service account
resource "google_project_iam_member" "dataflow_runner_service_account_roles" {
  depends_on = [google_project_service.required_services]
  for_each = toset([
    "roles/dataflow.worker",
    "roles/dataflow.serviceAgent",
    "roles/artifactregistry.reader"
  ])
  role    = each.key
  member  = "serviceAccount:${google_service_account.dataflow_runner.email}"
  project = var.project
}

// Provision IAM roles to the Cloud Build service agent required to build the templates
resource "google_project_iam_member" "cloud_build_roles" {
  depends_on = [google_project_service.required_services]
  for_each = toset([
    "roles/storage.objectViewer"
  ])
  role    = each.key
  member  = "serviceAccount:${data.google_project.default.number}@cloudbuild.gserviceaccount.com"
  project = var.project
}
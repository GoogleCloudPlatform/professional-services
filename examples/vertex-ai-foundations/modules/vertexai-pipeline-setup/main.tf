/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

resource "google_project_service" "gcp_services" {
  for_each           = toset(var.gcp_service_list)
  project            = var.project_id
  service            = each.key
  disable_on_destroy = var.disable_services_on_destroy
}

resource "google_service_account" "pipeline_sa" {
  account_id   = var.sa_account_id
  display_name = var.sa_display_name
  project      = var.project_id
}

resource "google_project_iam_custom_role" "vertexai_pipeline_role" {
  project     = var.project_id
  role_id     = var.role_id
  title       = var.role_title
  description = var.role_description
  permissions = var.role_permissions
}

resource "google_project_iam_binding" "pipeline_sa_iam" {
  project = var.project_id
  role    = "projects/${var.project_id}/roles/${google_project_iam_custom_role.vertexai_pipeline_role.role_id}"
  members = ["serviceAccount:${google_service_account.pipeline_sa.email}"]
}

resource "google_project_iam_binding" "additional_roles_iam" {
  for_each = toset(var.additional_roles != null ? var.additional_roles : [])
  project  = var.project_id
  role     = each.key
  members  = ["serviceAccount:${google_service_account.pipeline_sa.email}"]
}

resource "google_service_account_iam_binding" "pipeline_runners_list" {
  service_account_id = google_service_account.pipeline_sa.name
  role               = "roles/iam.serviceAccountUser"
  members            = var.pipeline_runners
}

resource "google_storage_bucket" "pipeline_bucket" {
  name     = var.bucket_name
  location = var.bucket_location
  project  = var.project_id
}

resource "google_storage_bucket_iam_binding" "sa_bucket_binding" {
  for_each = toset(var.bucket_sa_roles)
  bucket   = google_storage_bucket.pipeline_bucket.name
  role     = each.key
  members  = ["serviceAccount:${google_service_account.pipeline_sa.email}"]
}
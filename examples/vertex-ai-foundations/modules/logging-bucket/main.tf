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

resource "google_logging_project_bucket_config" "bucket" {
  count          = var.parent_type == "project" ? 1 : 0
  project        = var.parent
  location       = var.location
  retention_days = var.retention
  bucket_id      = var.id
  description    = var.description
}

resource "google_logging_folder_bucket_config" "bucket" {
  count          = var.parent_type == "folder" ? 1 : 0
  folder         = var.parent
  location       = var.location
  retention_days = var.retention
  bucket_id      = var.id
  description    = var.description
}

resource "google_logging_organization_bucket_config" "bucket" {
  count          = var.parent_type == "organization" ? 1 : 0
  organization   = var.parent
  location       = var.location
  retention_days = var.retention
  bucket_id      = var.id
  description    = var.description
}

resource "google_logging_billing_account_bucket_config" "bucket" {
  count           = var.parent_type == "billing_account" ? 1 : 0
  billing_account = var.parent
  location        = var.location
  retention_days  = var.retention
  bucket_id       = var.id
  description     = var.description
}

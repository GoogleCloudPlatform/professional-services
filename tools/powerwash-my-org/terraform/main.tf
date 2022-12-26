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

/*************************************************
  Random ID generation
*************************************************/

resource "random_id" "project_id" {
  byte_length = 8
}

/*************************************************
  Folders creation
*************************************************/

resource "google_folder" "folder-a" {
  display_name = "tf-folder-a"
  parent       = "organizations/${var.org_id}"
}

resource "google_folder" "folder-b" {
  display_name = "tf-folder-b"
  parent       = "organizations/${var.org_id}"
}

resource "google_folder" "folder-c" {
  display_name = "tf-folder-c"
  parent       = google_folder.folder-a.name
}

resource "google_folder" "folder-d" {
  display_name = "tf-folder-d"
  parent       = google_folder.folder-a.name
}

resource "google_folder" "folder-e" {
  display_name = "tf-folder-e"
  parent       = google_folder.folder-b.name
}

resource "google_folder" "folder-f" {
  display_name = "tf-folder-f"
  parent       = google_folder.folder-b.name
}

resource "google_folder" "folder-g" {
  display_name = "tf-folder-g"
  parent       = google_folder.folder-f.name
}

/*************************************************
  Project creation
*************************************************/

resource "google_project" "my_project-in-a-folder" {
  name       = "Project in a folder"
  project_id = "pwerwash-${random_id.project_id.hex}"
  folder_id  = google_folder.folder-g.name
}

/*************************************************
  Service account creation
*************************************************/

resource "google_service_account" "service_account" {
  account_id   = "sa-${random_id.project_id.hex}"
  display_name = "Service Account ${random_id.project_id.hex}"
  project      = google_project.my_project-in-a-folder.project_id
}

/*************************************************
  Organization policies creation
*************************************************/

resource "google_organization_policy" "serial_port_policy" {
  org_id     = var.org_id
  constraint = "compute.disableSerialPortAccess"

  boolean_policy {
    enforced = true
  }
}

resource "google_organization_policy" "disable_source_code_download" {
  org_id     = var.org_id
  constraint = "appengine.disableCodeDownload"

  boolean_policy {
    enforced = true
  }
}
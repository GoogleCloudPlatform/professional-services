#    Copyright 2023 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

data "google_project" "project" {
    project_id = var.project_id
}

locals {
  apis_to_enable = [
    "iam.googleapis.com",
    "storage.googleapis.com",
    "compute.googleapis.com",
    "artifactregistry.googleapis.com"
  ]
}

# Enable APIs
resource "google_project_service" "apis" {
  for_each = toset(local.apis_to_enable)
  service = each.key

  project = google_project.project.project_id
}


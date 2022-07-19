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

// Provision a docker registry to store required containers for the Dataflow templates
resource "google_artifact_registry_repository" "default" {
  depends_on    = [google_project_service.required_services]
  // TODO: refactor to using google provider instead of beta when generally available
  provider      = google-beta
  project       = var.project
  location      = var.region
  repository_id = var.repository_id
  format        = "DOCKER"
}
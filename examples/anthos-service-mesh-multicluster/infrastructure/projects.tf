/**
 * Copyright 2020 Google LLC
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

/**
# resource "google_project" "network" {
#  name                = var.project_network
#  project_id          = var.project_network
#  folder_id           = local.folder_id
#  billing_account     = var.billing_account
#  auto_create_network = false
#}
*/

# Enable GCP APIs

resource "google_project_service" "api_enabled_services_project_network" {
  project                    = var.project_id
  for_each                   = toset(var.api_enabled_services_project_network)
  service                    = each.key
  disable_dependent_services = true
  disable_on_destroy         = true
}
resource "google_project_service" "services_app1" {
  project                    = var.project_id
  for_each                   = toset(var.application_services)
  service                    = each.key
  disable_dependent_services = true
  disable_on_destroy         = true
}

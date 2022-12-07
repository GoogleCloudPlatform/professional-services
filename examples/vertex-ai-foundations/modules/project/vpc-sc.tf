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

# tfdoc:file:description VPC-SC project-level perimeter configuration.

moved {
  from = google_access_context_manager_service_perimeter_resource.service-perimeter-resource-standard
  to   = google_access_context_manager_service_perimeter_resource.standard
}

resource "google_access_context_manager_service_perimeter_resource" "standard" {
  count = var.service_perimeter_standard != null ? 1 : 0
  # this needs an additional lifecycle block in the vpc module on the
  # google_access_context_manager_service_perimeter resource
  perimeter_name = var.service_perimeter_standard
  resource       = "projects/${local.project.number}"
}

moved {
  from = google_access_context_manager_service_perimeter_resource.service-perimeter-resource-bridges
  to   = google_access_context_manager_service_perimeter_resource.bridge
}

resource "google_access_context_manager_service_perimeter_resource" "bridge" {
  for_each = toset(
    var.service_perimeter_bridges != null ? var.service_perimeter_bridges : []
  )
  # this needs an additional lifecycle block in the vpc module on the
  # google_access_context_manager_service_perimeter resource
  perimeter_name = each.value
  resource       = "projects/${local.project.number}"
}

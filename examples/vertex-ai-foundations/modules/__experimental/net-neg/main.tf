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

resource "google_compute_network_endpoint_group" "group" {
  project    = var.project_id
  name       = var.name
  network    = var.network
  subnetwork = var.subnetwork
  zone       = var.zone
}

resource "google_compute_network_endpoint" "endpoint" {
  for_each               = { for endpoint in var.endpoints : endpoint.instance => endpoint }
  project                = var.project_id
  network_endpoint_group = google_compute_network_endpoint_group.group.name
  instance               = each.value.instance
  port                   = each.value.port
  ip_address             = each.value.ip_address
  zone                   = var.zone
}

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

resource "google_compute_address" "psc_endpoint_address" {
  name         = var.name
  project      = var.project_id
  address_type = "INTERNAL"
  subnetwork   = var.subnet
  region       = var.region
}

resource "google_compute_forwarding_rule" "psc_ilb_consumer" {
  name                  = var.name
  project               = var.project_id
  region                = var.region
  target                = var.sa_id
  load_balancing_scheme = ""
  network               = var.network
  ip_address            = google_compute_address.psc_endpoint_address.id
}

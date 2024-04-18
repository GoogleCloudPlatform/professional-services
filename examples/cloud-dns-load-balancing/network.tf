/**
 * Copyright 2024 Google LLC
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

data "google_compute_network" "lb_network" {
  name       = var.vpc_network
}
data "google_compute_subnetwork" "lb_subnetwork" {
  for_each      = var.locations
  name          = var.subnet
  region        = each.key
}

resource "google_compute_subnetwork" "proxy_subnetwork" {
  for_each      = data.google_compute_subnetwork.lb_subnetwork
  name          = "proxy-${each.value.region}"
  region        = each.value.region
  network       = data.google_compute_network.lb_network.name
  ip_cidr_range = var.locations[each.value.region].ip_cidr_range
  purpose       = "REGIONAL_MANAGED_PROXY" 
  role          = "ACTIVE"
}

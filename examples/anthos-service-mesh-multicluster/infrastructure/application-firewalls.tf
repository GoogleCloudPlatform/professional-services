/**
 * Copyright 2021 Google LLC
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

# Running on cluster4 cluster:
#   "adservice:9555"
#   "cartservice:7070"
#   "currencyservice:7000"
#   "emailservice:5000"
#   "productcatalogservice:3550"
#   "recommendationservice:8080"
#   "shippingservice:50051"
#   "checkoutservice:5050"

resource "google_compute_firewall" "from-cluster3-to-cluster4" {
  name          = "${var.prefix}-from-cluster3-to-cluster4"
  project       = var.project_id
  network       = google_compute_network.asm-vpc-3.name
  source_ranges = ["10.185.128.0/18"]
  target_tags   = ["cluster4"]
  allow {
    protocol = "tcp"
    ports    = [9555, 7070, 7000, 5000, 3550, 8080, 50051, 5050]
  }
}

resource "google_compute_firewall" "from-cluster4-to-cluster3" {
  name          = "${var.prefix}-from-cluster4-to-cluster3"
  project       = var.project_id
  network       = google_compute_network.asm-vpc-3.name
  source_ranges = ["10.185.192.0/18"]
  target_tags   = ["cluster3"]
  allow {
    protocol = "tcp"
    ports    = [5000]
  }
}

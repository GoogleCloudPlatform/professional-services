/**
 * Copyright 2018 Google LLC
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

resource "google_compute_firewall" "history-ui-access" {
  project          = "${var.project}"
  name    = "${var.network}-hadoop-history-ui-access"
  network = "${var.network}"

  allow = {
    protocol = "tcp"
    ports    = ["18080", "19888"]
  }

  target_tags   = ["hadoop-history-ui-access"]
  source_ranges = ["${var.data-eng-cidr-range}"]
  direction     = "INGRESS"
}

resource "google_compute_firewall" "admin-ui-access" {
  project          = "${var.project}"
  name    = "${var.network}-hadoop-admin-ui-access"
  network = "${var.network}"

  allow = {
    protocol = "tcp"
    ports    = ["8088", "4040"]
  }

  target_tags   = ["hadoop-admin-ui-access"]
  source_ranges = ["${var.data-eng-cidr-range}"]
  direction     = "INGRESS"
}

resource "google_compute_firewall" "allow-ssh" {
  project          = "${var.project}"
  name    = "${var.network}-allow-ssh"
  network = "${var.network}"

  allow = {
    protocol = "tcp"
    ports    = ["22"]
  }

  target_tags   = ["hadoop-admin-ui-access"]
  source_ranges = ["${var.data-eng-cidr-range}"]
  direction     = "INGRESS"
}

resource "google_compute_firewall" "deny-egress" {
  project          = "${var.project}"
  name               = "${var.network}-deny-egress"
  network            = "${var.network}"
  deny = {
    protocol = "all"
  }
  target_tags        = ["hadoop-admin-ui-access"]
  direction          = "EGRESS"
  destination_ranges = ["0.0.0.0/0"]
  priority           = "65535"
}

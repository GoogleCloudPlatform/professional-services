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

# Default Compute Engine service account for bastion server
# https://cloud.google.com/compute/docs/access/service-accounts#default_service_account
data "google_compute_default_service_account" "default" {
}

# Create service accounts used for connecting the GKE clusters with an Anthos Environ
# https://cloud.google.com/anthos/multicluster-management/connect/registering-a-cluster
# These service accounts are used in the register_cluster function in scripts/main.sh
resource "google_service_account" "cluster-with-environ-cluster3" {
  project      = var.project_id
  account_id   = "${var.prefix}-cluster3-connect"
  display_name = "${var.prefix}-cluster3-connect"
}

resource "google_service_account" "cluster-with-environ-cluster4" {
  project      = var.project_id
  account_id   = "${var.prefix}-cluster4-connect"
  display_name = "${var.prefix}-cluster4-connect"
}

resource "google_project_iam_binding" "project" {
  project = var.project_id
  role    = "roles/gkehub.connect"

  members = [
    "serviceAccount:${google_service_account.cluster-with-environ-cluster3.email}",
    "serviceAccount:${google_service_account.cluster-with-environ-cluster4.email}",
  ]
}

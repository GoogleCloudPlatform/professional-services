# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# create the service account for our cluster worker nodes

# TODO: In order to use the configured oauth_scopes for logging and monitoring, 
# the service account being used needs the roles/logging.logWriter 
# and roles/monitoring.metricWriter roles.
resource "google_service_account" "gke-cluster-svc-account" {
  account_id   = "${var.node_config_svc_account}"
  display_name = "${var.node_config_svc_account}"
}

# create the service account for our cluster worker nodes
resource "google_service_account" "gke-bastion-svc-account" {
  account_id   = "${var.bastion_svc_account}"
  display_name = "${var.bastion_svc_account}"
}

# apply cluster admin policy to bastion service account
resource "google_project_iam_binding" "project" {
  project = "${var.project}"
  role    = "${var.bastion_svc_account_role}"

  members = [
    "serviceAccount:${google_service_account.gke-bastion-svc-account.email}",
  ]
}

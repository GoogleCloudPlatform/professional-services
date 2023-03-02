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

locals {
  minimal_sa_roles = [
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter"
  ]
}

resource "google_service_account" "default" {
  for_each     = { m = "master", w = "worker" }
  project      = var.service_project.project_id
  account_id   = "${local.infra_id}-${each.key}"
  display_name = "Openshift ${each.value} for ${local.infra_id}."
}

# https://docs.openshift.com/container-platform/4.7/installing/installing_gcp/installing-gcp-user-infra-vpc.html#installation-creating-gcp-iam-shared-vpc_installing-gcp-user-infra-vpc

resource "google_project_iam_member" "host-master" {
  for_each = toset([
    "roles/compute.networkUser",
    "roles/compute.networkViewer"
  ])
  project = var.host_project.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.default["m"].email}"
}

resource "google_project_iam_member" "host-worker" {
  for_each = toset([
    "roles/compute.networkUser"
  ])
  project = var.host_project.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.default["w"].email}"
}

# This on the other hand seems excessive
# https://docs.openshift.com/container-platform/4.7/installing/installing_gcp/installing-restricted-networks-gcp.html#installation-creating-gcp-iam-shared-vpc_installing-restricted-networks-gcp

resource "google_project_iam_member" "service-master" {
  for_each = toset(concat(local.minimal_sa_roles, [
    "roles/compute.instanceAdmin",
    "roles/compute.networkAdmin",
    "roles/compute.securityAdmin",
    "roles/iam.serviceAccountUser",
    "roles/storage.admin"
  ]))
  project = var.service_project.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.default["m"].email}"
}

resource "google_project_iam_member" "service-worker" {
  for_each = toset(concat(local.minimal_sa_roles, [
    "roles/compute.viewer",
    "roles/storage.admin"
  ]))
  project = var.service_project.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.default["w"].email}"
}

resource "google_project_iam_member" "machineset-operator" {
  count   = local.machine_sa == null ? 0 : 1
  project = var.host_project.project_id
  role    = "roles/compute.networkUser"
  member  = "serviceAccount:${local.machine_sa}@${var.service_project.project_id}.iam.gserviceaccount.com"
}

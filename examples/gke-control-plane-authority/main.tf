/**
 * Copyright 2025 Google LLC
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

provider "google" {
  project = var.project_id
}

provider "google-beta" {
  project = var.project_id
}

data "google_project" "project" {
  project_id = var.project_id
}

locals {
  suffix         = var.suffix
  project_number = data.google_project.project.number

  ca_max_issuer_path_length = 3

  k8s_sa_signing_keys      = ["sa-signing-${local.suffix}"]
  k8s_cluster_signing_keys = ["cluster-ca-${local.suffix}", "etcd-peer-ca-${local.suffix}", "etcd-api-ca-${local.suffix}", "aggregation-ca-${local.suffix}"]

  gke_service_agent = "service-${local.project_number}@container-engine-robot.iam.gserviceaccount.com"

  cluster_name = "${var.cluster_name}-${local.suffix}"

  labels = { cluster_name = var.cluster_name }

  services = [
    "container.googleapis.com",
    "privateca.googleapis.com",
    "kms.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each           = toset(local.services)
  service            = each.key
  disable_on_destroy = false
}


resource "google_project_service_identity" "privateca-sa" {
  provider = google-beta
  service  = "privateca.googleapis.com"
}

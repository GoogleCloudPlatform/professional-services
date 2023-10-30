/**
 * Copyright 2023 Google LLC
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

data "google_vpc_access_connector" "connector" {
  project = var.project
  region  = var.region
  name    = var.serverless-vpc-connector-name
}

data "google_service_account" "cloud_run_sa" {
  account_id = var.cloudrun-service-account-name
}

resource "google_secret_manager_secret" "secret" {
  secret_id = var.vCenter-password-secret
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "secret-version-data" {
  secret      = google_secret_manager_secret.secret.name
  secret_data = "replace-me" # to be populated outside of terraform
}

resource "google_cloud_run_v2_job" "default" {
  name     = var.cloudrun-job-name
  location = var.region

  template {
    template {
      service_account = data.google_service_account.cloud_run_sa.email
      containers {
        image = var.cloudrun-image
        env {
          name  = "dataset_region"
          value = var.region
        }
        env {
          name  = "datastore_table"
          value = "${var.project}:${var.dataset-name}.${var.datastore-table-name}"
        }
        env {
          name  = "esxi_table"
          value = "${var.project}:${var.dataset-name}.${var.esxi-table-name}"
        }
        env {
          name  = "vm_table"
          value = "${var.project}:${var.dataset-name}.${var.vm-table-name}"
        }
        env {
          name  = "vCenter_username"
          value = var.vCenter-username
        }
        env {
          name  = "vCenter_server"
          value = var.vCenter-server
        }
        env {
          name  = "vCenter_password"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.secret.secret_id
              version = "latest"
            }
          }
        }
      }
      vpc_access {
        connector = data.google_vpc_access_connector.connector.id
        egress    = "ALL_TRAFFIC"
      }
    }
  }

  lifecycle {
    ignore_changes = [
      launch_stage,
    ]
  }
}

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

/**
 * Source: https://github.com/terraform-google-modules/terraform-docs-samples/blob/main/cloud_run_service_ingress/main.tf
 */
resource "google_cloud_run_v2_service" "cr_service" {
  count         = var.generation == "v2" ? 1 : 0
  provider      = google
  project       = var.project_id
  name          = "cr2-service"  
  location      = var.location
  launch_stage  = "GA"

  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"
  custom_audiences = [ "cr-service" ]

  template {
    containers {
      # image = "gcr.io/cloudrun/hello" # public image for your service
      image = var.image
      env {
        name="NAME"   # Setting this environment variable makes service return 200 by default
        value="OK"    # Remove this environment variable at runtime to simulate service outage
      }               # It will respond with 503 if "NAME" variable is not set
    }
  }
  traffic {
    percent         = 100
    type = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  lifecycle {
    ignore_changes = [
      custom_audiences
    ]
  }
}

resource "google_compute_region_network_endpoint_group" "cloudrun_v2_sneg" {
  count                 = var.generation == "v2" ? 1 : 0
  name                  = "cloudrun-sneg"
  network_endpoint_type = "SERVERLESS"
  region                = var.location
  cloud_run {
    service = google_cloud_run_v2_service.cr_service[0].name
  }
}

resource "google_cloud_run_v2_service_iam_member" "public-access" {
  count    = var.generation == "v2" && var.allow_unauthenticated ? 1 : 0
  name     = google_cloud_run_v2_service.cr_service[0].name
  location = google_cloud_run_v2_service.cr_service[0].location
  project  = google_cloud_run_v2_service.cr_service[0].project
  role     = "roles/run.invoker"
  member   = "allUsers"
}
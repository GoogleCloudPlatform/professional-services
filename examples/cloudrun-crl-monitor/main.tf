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

resource "google_project_service" "cloud_monitoring_api" {
  service            = "monitoring.googleapis.com"
  project            = var.project_id
  disable_on_destroy = false
}

data "google_project" "project" {
  project_id = var.project_id
}

resource "google_project_iam_member" "crl_job_metric_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

module "crl_monitor" {
  source = "./crl-monitor"
  for_each = { for m in var.crl_monitors : m.target_url => m }

  project_id = var.project_id
  region     = each.value.region
  name       = each.value.name
  target_url = each.value.target_url
  schedule = each.value.schedule
  crl_expiration_buffer = each.value.crl_expiration_buffer
}
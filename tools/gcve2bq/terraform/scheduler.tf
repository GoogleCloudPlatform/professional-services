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

data "google_service_account" "scheduler_sa" {
  account_id = var.scheduler-service-account-name
}

resource "google_cloud_scheduler_job" "job" {
  name             = var.scheduler-job-name
  description      = "Scheduler for GCVE Utilization export"
  schedule         = "0 */1 * * *"
  time_zone        = "America/New_York"
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project}/jobs/${var.cloudrun-job-name}:run"

    oauth_token {
      service_account_email = data.google_service_account.scheduler_sa.email
    }

    headers = {
      "User-Agent" = "Google-Cloud-Scheduler"
    }
  }
}

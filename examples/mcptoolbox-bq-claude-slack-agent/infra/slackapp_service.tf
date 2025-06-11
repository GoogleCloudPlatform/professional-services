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

resource "google_cloud_run_v2_service" "slackapp_service" {
  name     = var.service_name
  location = var.region

  template {
    # Add annotations to force a new revision when code changes
    annotations = {
      "app-code-version-src" = null_resource.cloud_build_on_change.triggers.app_src_hash
      "app-code-version-pom" = null_resource.cloud_build_on_change.triggers.pom_xml_hash
      "app-code-version-dockerfile" = null_resource.cloud_build_on_change.triggers.dockerfile_hash
    }
    service_account = google_service_account.slackapp.email
    scaling {
      min_instance_count = 1
      max_instance_count = 1
    }
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.default.repository_id}/${var.service_name}:latest"
      resources {
        startup_cpu_boost = true
      }
      ports {
        container_port = 8080
      }
      env {
        name  = "CLAUDE_API_KEY"
        value = var.claude_apikey
      }
      env {
        name  = "SLACK_BOT_TOKEN"
        value = var.slackbot_workspace_token
      }
      env {
        name  = "SLACK_SIGNING_SECRET"
        value = var.slackapp_signing_secret
      }
      env {
        name  = "MCPTOOLBOX_URL"
        value = local.mcp_server_uri
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_artifact_registry_repository.default,
    google_cloud_run_service_iam_member.mcp_allow_slackapp,
    google_project_iam_member.cloudrun_slackapp
  ]
}

# Allow unauthenticated invocations for the Cloud Run service
resource "google_cloud_run_service_iam_member" "slack_allow_unauthenticated" {
  location = google_cloud_run_v2_service.slackapp_service.location
  project  = google_cloud_run_v2_service.slackapp_service.project
  service  = google_cloud_run_v2_service.slackapp_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_project_iam_member" "cloudrun_slackapp" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.slackapp.email}"
}

resource "google_service_account" "slackapp" {
  project    = var.project_id
  account_id = "slackapp"
}

data "archive_file" "app_src_archive" {
  type        = "zip"
  source_dir  = "../src"
  output_path = ".terraform/temp/app_src.zip"
}

data "local_file" "pom_xml" {
  filename = "../pom.xml"
}


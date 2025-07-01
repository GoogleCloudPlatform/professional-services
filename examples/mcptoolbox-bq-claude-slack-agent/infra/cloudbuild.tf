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

resource "google_artifact_registry_repository" "default" {
  location      = var.region
  repository_id = var.artifact_registry_repository_name
  description   = "Docker repository for the Slack - Claude - MCPToolbox integration."
  format        = "DOCKER"
}

resource "null_resource" "cloud_build_on_change" {
  triggers = {
    app_src_hash = data.archive_file.app_src_archive.output_sha,
    pom_xml_hash = filesha256("../pom.xml")
    dockerfile_hash = filesha256("../Dockerfile")
  }

  provisioner "local-exec" {
    command     = <<EOT
      echo "Code changes detected, triggering Cloud Build..."
      gcloud builds submit . \
        --project ${var.project_id} \
        --region ${var.region} \
        --config cloudbuild.yaml \
        --ignore-file .cloudignore \
        --substitutions _SERVICE_NAME=${var.service_name},_REGION=${var.region},_ARTIFACT_REGISTRY_REPO_NAME=${google_artifact_registry_repository.default.repository_id} \
        --quiet
    EOT
    working_dir = "../"
  }

  depends_on = [
    google_artifact_registry_repository.default,
  ]
}
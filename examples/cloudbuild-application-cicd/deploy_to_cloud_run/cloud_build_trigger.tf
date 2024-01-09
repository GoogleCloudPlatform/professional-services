# Copyright 2023 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Artifact Registries GCR
data "google_pubsub_topic" "cicd_ar_image_pub" {
  project = var.cicd_project_id
  name    = "gcr"
}

# This is a Cloud Build trigger that will deploy the latest version of the
# PUP Backend app to the Environment.
resource "google_cloudbuild_trigger" "deploy_app" {
  # https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloudbuild_trigger
  project     = data.google_project.cicd.name
  name        = "app-deploy-to-cloud-run"
  description = "Deploy Application latest to Cloud Run within Region ${var.region}."
  tags        = ["app", "deploy", "cloud-run"]
  location    = var.region

  substitutions = {
    _ACTION                = "$(body.message.data.action)"
    _IMAGE_TAG             = "$(body.message.data.tag)"
    _CICD_PROJECT          = var.cicd_project_id
    _DEPLOY_PROJECT        = var.project_id
    _DEPLOY_REGION         = var.region
    _AR_LOC                = var.cicd_ar_docker_loc
    _AR_REPO               = var.cicd_ar_docker_name
    _APPLICATION           = var.application_name
    _APP_IMAGE_NAME        = var.application_name
    _SWAGGER               = var.production ? "false" : "true"
    _SERVICE_ACCOUNT_EMAIL = "${var.application_name}-sa@${var.project_id}.iam.gserviceaccount.com"
    _LOG_LEVEL             = var.production ? "info" : "debug"
  }

  # This filter allows this cloud build trigger to only initiate when a new
  # image is pushed to the Artifact Registry repository for the PUP Backend app.
  filter = <<EOT
  _ACTION.matches('INSERT') &&
  _IMAGE_TAG.matches(
    '${var.cicd_ar_docker_loc}' +
    '-docker.pkg.dev/' +
    '${data.google_project.cicd.name}/' +
    '${var.cicd_ar_docker_name}/' +
    '${var.application_name}' +
    ':latest'
    )
  EOT

  pubsub_config {
    topic = data.google_pubsub_topic.cicd_ar_image_pub.id
  }

  source_to_build {
    repo_type = "CLOUD_SOURCE_REPOSITORIES"
    ref       = "refs/heads/main"
    uri       = "https://source.developers.google.com/p/${data.google_project.cicd.name}/r/${var.application_name}"
  }

  git_file_source {
    path      = "cloudbuild/deploy_cloud_run.yaml"
    repo_type = "CLOUD_SOURCE_REPOSITORIES"
    revision  = "refs/heads/main"
  }
}

/**
 * Copyright 2021 Google LLC
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
  apis = ["iam.googleapis.com", "run.googleapis.com", "artifactregistry.googleapis.com"]
}

data "google_project" "project" {
  project_id = var.project
}

resource "google_project_service" "project" {
  for_each           = toset(local.apis)
  project            = data.google_project.project.project_id
  service            = each.key
  disable_on_destroy = false
}

resource "google_service_account" "service_account" {
  account_id   = lower("${var.project}-sapro")
  project       = data.google_project.project.project_id
  display_name = "Service Account for SAPRO"

  depends_on = [
    google_project_service.project,
  ]
}

resource "google_storage_bucket" "bucket" {
  name                        = lower("${var.project}-sapro")
  location                    = "EU"
  force_destroy               = true
  uniform_bucket_level_access = true

  depends_on = [
    google_project_service.project,
  ]
}

resource "google_storage_bucket_iam_member" "member" {
  bucket = google_storage_bucket.bucket.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.service_account.email}"
}

resource "google_storage_bucket_object" "config_file" {
  name   = "${var.config_storage_path}/config.yaml"
  source = "config.yaml"
  bucket = google_storage_bucket.bucket.name
}

resource "google_artifact_registry_repository" "registry" {
  provider = google-beta

  location      = var.artifact_registry_location
  project       = data.google_project.project.project_id
  repository_id = lower("${var.project}-sapro")
  description   = "Docker repository for Service Account Provider"
  format        = "DOCKER"

  depends_on = [
    google_project_service.project
  ]
}


resource "null_resource" "docker_image" {
  provisioner "local-exec" {
    command = <<EOT
gcloud auth configure-docker ${var.artifact_registry_location}-docker.pkg.dev
docker buildx build --platform linux/amd64 --push -t ${var.artifact_registry_location}-docker.pkg.dev/${var.project}/${var.project}-sapro/sapro:${var.container_version} .
EOT
  }

  triggers = {
    "variable" = var.container_version
  }
}

resource "google_cloud_run_service" "sapro" {
  name     = "sapro-srv"
  location = var.region

  template {
    spec {
      containers {
        image = "${var.artifact_registry_location}-docker.pkg.dev/${var.project}/${var.project}-sapro/sapro:${var.container_version}"
        env {
          name  = "GCS_CONFIG_LINK"
          value = "${google_storage_bucket.bucket.url}/${var.config_storage_path}"
        }
        env {
          name  = "CONFIG_REFRESH_INTERVAL"
          value = var.refresh_interval
        }
      }
      service_account_name = google_service_account.service_account.email
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "1"
        "autoscaling.knative.dev/minScale" = "0"
      }
    }
  }

  metadata {
    annotations = {
      "run.googleapis.com/ingress" = "all"
      "run.googleapis.com/launch-stage" = "BETA"
    }
  }
  autogenerate_revision_name = true

  depends_on = [
    null_resource.docker_image,
    google_project_service.project,
    google_storage_bucket_iam_member.member,
    google_storage_bucket_object.config_file,
  ]
}

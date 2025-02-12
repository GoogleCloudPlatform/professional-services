# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

// Query custom network
data "google_compute_network" "default" {
  name = var.network
}

// Query custom subnetwork
data "google_compute_subnetwork" "default" {
  name   = var.subnetwork
  region = var.region
}

// Query worker service account
data "google_service_account" "default" {
  account_id = var.service_account_id
}

// Provision Java Dataflow Custom template build trigger
resource "google_cloudbuild_trigger" "dataflow_template_build_trigger_java" {
  name = "dataflow-template-build-trigger-java"
  github {
    owner = var.github_repository_owner
    name  = var.github_repository_name
    push {
      branch = var.github_repository_branch
    }
  }
  build {
    timeout = "1800s"
    step {
      dir        = "${var.working_dir_prefix}/java"
      id         = "wordcount:build_jar"
      name       = "gradle:jdk11"
      entrypoint = "gradle"
      args       = ["shadowJar"]
    }

    step {
      id         = "wordcount:build_dataflow_batch_template-java"
      name       = "gcr.io/google.com/cloudsdktool/cloud-sdk"
      entrypoint = "gcloud"
      args = [
        "dataflow",
        "flex-template",
        "build",
        "gs://${google_storage_bucket.dataflow_templates.name}/${var.image_prefix}-java-batch.json",
        "--project=${var.project}",
        "--image-gcr-path=${var.region}-docker.pkg.dev/${var.project}/${var.artifact_registry_id}/${var.image_prefix}-java",
        "--metadata-file=/workspace/${var.working_dir_prefix}/infrastructure/04.template/dataflow-template.json",
        "--sdk-language=JAVA",
        "--flex-template-base-image=JAVA11",
        "--jar=/workspace/${var.working_dir_prefix}/java/build/libs/${lower(var.java_class_name)}-latest-all.jar",
        "--env=FLEX_TEMPLATE_JAVA_MAIN_CLASS=${var.java_package_name}.${var.java_class_name}",
        "--network=${data.google_compute_network.default.name}",
        "--subnetwork=regions/${var.region}/subnetworks/${data.google_compute_subnetwork.default.name}",
        "--disable-public-ips",
        "--service-account-email=${data.google_service_account.default.email}"
      ]
    }
  }
}

// Provision Python Dataflow Custom template build trigger
resource "google_cloudbuild_trigger" "dataflow_template_build_trigger_python" {
  name = "dataflow-template-build-trigger-python"
  github {
    owner = var.github_repository_owner
    name  = var.github_repository_name
    push {
      branch = var.github_repository_branch
    }
  }
  build {
    timeout = "1800s"

    step {
      dir        = "${var.working_dir_prefix}/python"
      id         = "wordcount:build_docker_image"
      name       = "gcr.io/google.com/cloudsdktool/cloud-sdk"
      entrypoint = "gcloud"
      args = [
        "builds",
        "submit",
        "--tag=${var.region}-docker.pkg.dev/${var.project}/${var.artifact_registry_id}/${var.image_prefix}-python"
      ]
    }

    step {
      id         = "wordcount:build_dataflow_batch_template-python"
      name       = "gcr.io/google.com/cloudsdktool/cloud-sdk"
      entrypoint = "gcloud"
      args = [
        "dataflow",
        "flex-template",
        "build",
        "gs://${google_storage_bucket.dataflow_templates.name}/${var.python_file_name}-python-batch.json",
        "--project=${var.project}",
        "--image=${var.region}-docker.pkg.dev/${var.project}/${var.artifact_registry_id}/wordcount-python",
        "--metadata-file=/workspace/${var.working_dir_prefix}/infrastructure/04.template/dataflow-template.json",
        "--sdk-language=PYTHON",
        "--network=${data.google_compute_network.default.name}",
        "--subnetwork=regions/${var.region}/subnetworks/${data.google_compute_subnetwork.default.name}",
        "--disable-public-ips",
        "--service-account-email=${data.google_service_account.default.email}"
      ]
    }
  }
}

// Provision Go Dataflow Custom template build trigger
resource "google_cloudbuild_trigger" "dataflow_template_build_trigger_go" {
  name = "dataflow-template-build-trigger-go"
  github {
    owner = var.github_repository_owner
    name  = var.github_repository_name
    push {
      branch = var.github_repository_branch
    }
  }
  build {
    timeout = "1800s"

    step {
      dir        = "${var.working_dir_prefix}/go"
      id         = "wordcount:build_docker_image"
      name       = "gcr.io/google.com/cloudsdktool/cloud-sdk"
      entrypoint = "gcloud"
      args       = [
        "builds",
        "submit",
        "--tag=${var.region}-docker.pkg.dev/${var.project}/${var.artifact_registry_id}/${var.image_prefix}-go"
      ]
    }

    step {
      id         = "wordcount:build_dataflow_batch_template-go"
      name       = "gcr.io/google.com/cloudsdktool/cloud-sdk"
      entrypoint = "gcloud"
      args       = [
        "dataflow",
        "flex-template",
        "build",
        "gs://${google_storage_bucket.dataflow_templates.name}/${var.go_application_name}-go-batch.json",
        "--project=${var.project}",
        "--image=${var.region}-docker.pkg.dev/${var.project}/${var.artifact_registry_id}/${var.go_application_name}-go",
        "--metadata-file=/workspace/${var.working_dir_prefix}/infrastructure/04.template/dataflow-template.json",
        "--sdk-language=GO",
        "--network=${data.google_compute_network.default.name}",
        "--subnetwork=regions/${var.region}/subnetworks/${data.google_compute_subnetwork.default.name}",
        "--disable-public-ips",
        "--service-account-email=${data.google_service_account.default.email}"
      ]
    }
  }
}

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

// Query the allocated network for the Dataflow worker
data "google_compute_network" "default" {
  name = var.network
}

// Query the allocated subnetwork for the Dataflow worker
data "google_compute_subnetwork" "default" {
  name   = var.subnetwork
  region = var.region
}

// Query the allocated service account for the Dataflow worker
data "google_service_account" "default" {
  account_id = var.service_account_id
}

// Provision the Cloud Build trigger that builds the Custom Dataflow template
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
      dir        = var.cloud_build_working_directory
      id         = "csvio:build_jar"
      name       = "gradle:jdk11"
      entrypoint = "gradle"
      args       = ["shadowJar"]
    }

    step {
      dir        = var.cloud_build_working_directory
      id         = "csvio:build_dataflow_batch_template"
      name       = "gcr.io/google.com/cloudsdktool/cloud-sdk"
      entrypoint = "gcloud"
      args       = [
        "dataflow",
        "flex-template",
        "build",
        "gs://${google_storage_bucket.dataflow_templates.name}/${lower(var.java_class_name)}-batch.json",
        "--project=${var.project}",
        "--image-gcr-path=${var.region}-docker.pkg.dev/${var.project}/${var.artifact_registry_id}/${lower(var.java_class_name)}",
        "--metadata-file=/workspace/${var.cloud_build_working_directory}/infrastructure/04.template/dataflow-template.json",
        "--sdk-language=JAVA",
        "--flex-template-base-image=JAVA11",
        "--jar=/workspace/${var.cloud_build_working_directory}/build/libs/${var.jar_file_name}",
        "--env=FLEX_TEMPLATE_JAVA_MAIN_CLASS=${var.java_package_name}.${var.java_class_name}",
        "--network=${data.google_compute_network.default.name}",
        "--subnetwork=regions/${var.region}/subnetworks/${data.google_compute_subnetwork.default.name}",
        "--disable-public-ips",
        "--service-account-email=${data.google_service_account.default.email}"
      ]
    }
  }
}
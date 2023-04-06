# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

module "gcs" {
  source         = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/gcs/"
  project_id     = var.project_id
  name           = "${var.region}-${var.project_id}-dataproc-jobs"
  location       = var.region
  storage_class  = "REGIONAL"
}

resource "google_dataproc_autoscaling_policy" "dataproc_autoscaling_policy_test" {
  project = var.project_id
  policy_id = var.dataproc_config.autoscaling_policy_id
  location  = var.region
  worker_config {
    max_instances = 5
  }
  basic_algorithm {
    yarn_config {
      graceful_decommission_timeout = "30s"
      scale_up_factor   = 0.5
      scale_down_factor = 0.5
    }
  }
}

module "dataproc-service-account" {
  ## Modify depending on the data processing jobs to run in Dataproc Clusters
  source     = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/iam-service-account"
  project_id = var.project_id
  name       = var.dataproc_service_account
  iam_project_roles = {
    (var.project_id) = [
      "roles/iam.serviceAccountUser",
      "roles/datacatalog.admin",
      "roles/dataproc.worker",
      "roles/storage.admin"
    ]
  }
}

resource "google_storage_bucket_object" "dataproc_job_files" {
  for_each = fileset(path.module, "jobs/*")
  name   = each.value
  source = each.value
  bucket = "${replace(replace(module.gcs.name,"gs://",""),"/jobs","")}"
}

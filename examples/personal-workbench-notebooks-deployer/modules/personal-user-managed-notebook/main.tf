# Copyright 2023 Google LLC
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

data "google_compute_network" "my_network" {
  name    = var.network_name
  project = var.project_id
}

data "google_compute_subnetwork" "my_subnetwork" {
  name    = var.sub_network_name
  region  = var.region
  project = var.project_id
}

resource "google_service_account" "notebook_instance_sa" {
  account_id   = "notebook-instance-sa"
  project      = var.project_id
  display_name = "Personal Auth notebooks Service Account"
}

resource "google_project_iam_binding" "sa_binding" {
  for_each = toset(var.service_acct_roles)
  project  = var.project_id
  role     = each.key
  members  = [
    "serviceAccount:${google_service_account.notebook_instance_sa.email}",
  ]
}

resource "google_storage_bucket" "personal_dataproc_notebooks_bucket" {
  name                     = var.personal_dataproc_notebooks_bucket_name
  location                 = var.region
  project                  = var.project_id
  public_access_prevention = "enforced"
  force_destroy            = true
}

resource "google_storage_bucket_object" "dataproc_template_file_generator" {
  name       = "template_generator.sh"
  source     = "modules/personal-user-managed-notebook/template_generator.sh"
  bucket     = google_storage_bucket.personal_dataproc_notebooks_bucket.name
  depends_on = [google_storage_bucket.personal_dataproc_notebooks_bucket]
}

resource "google_storage_bucket_object" "dataproc_startup_script" {
  name       = "enable_spark_bq.sh"
  source     = "modules/personal-user-managed-notebook/enable_spark_bq.sh"
  bucket     = google_storage_bucket.personal_dataproc_notebooks_bucket.name
  depends_on = [google_storage_bucket.personal_dataproc_notebooks_bucket]
}

resource "google_storage_bucket_object" "dataproc_source_templates" {
  for_each   = fileset(path.module, join("/", ["..", "..", var.master_templates_path_name, "*"]))
  name       = substr(each.value, 6, 47)
  source     = substr(each.value, 6, 47)
  bucket     = google_storage_bucket.personal_dataproc_notebooks_bucket.name
  depends_on = [google_storage_bucket.personal_dataproc_notebooks_bucket]
}
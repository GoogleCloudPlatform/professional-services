# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


provider "google" {
  project = "${var.project_id}"
  region  = "${var.region}"
}

provider "google-beta" {
  project = "${var.project_id}"
  region  = "${var.region}"
}

# Enable APIs; Must be individual resources or else it will disable all other APIs for the project.
resource "google_project_service" "billingapi" {
  service = "cloudbilling.googleapis.com"
}

resource "google_project_service" "bqapi" {
  service = "bigquery-json.googleapis.com"
}

resource "google_project_service" "composerapi" {
  service = "composer.googleapis.com"
}

# Create Service Account
resource "google_service_account" "cud_service_account" {
  account_id   = "cascada-user"
  display_name = "CUD Correction Service Account"
}

# Create Custom IAM Role
resource "google_project_iam_custom_role" "cud_iam_role" {
  role_id = "CudCorrectionIAMRole"
  title   = "IAM Custom Role for CUD Correction Service Account"
  permissions = [
    "bigquery.jobs.create",
    "bigquery.tables.create",
    "bigquery.tables.updateData",
    "bigquery.tables.get",
    "bigquery.tables.getData"
  ]
}

# Grant custom role to service account
resource "google_project_iam_binding" "custom_role_binding" {
  members = ["serviceAccount:${google_service_account.cud_service_account.email}"]
  role    = "projects/${var.project_id}/roles/${google_project_iam_custom_role.cud_iam_role.role_id}"
}

# Grant Cloud Composer Role to service account
resource "google_project_iam_binding" "composer_binding" {
  members = ["serviceAccount:${google_service_account.cud_service_account.email}"]
  role    = "roles/composer.worker"
}

# Grant BigQuery Permissions for Service Account on Corrected Dataset
resource "google_bigquery_dataset" "corrected_dataset" {
  dataset_id = "${var.corrected_dataset_id}"
  location   = "${var.billing_export_location}"

  access {
    role          = "WRITER"
    user_by_email = "${google_service_account.cud_service_account.email}"
  }
}

# Create bucket for Composer temporary file store
resource "google_storage_bucket" "commitment_file_store" {
  name     = "${var.project_id}-cud-correction-commitment-data"
  location = "${var.billing_export_location}"
}

# Create Composer Environment
resource "google_composer_environment" "env" {
  provider = "google-beta"
  name     = "cud-correction-env"
  region   = "${var.region}"
  depends_on = ["google_project_service.composerapi",
    "google_project_iam_binding.custom_role_binding",
    "google_project_iam_binding.composer_binding",
    "google_storage_bucket.commitment_file_store"
  ]

  config {
    node_config {
      zone            = "${var.zone}"
      service_account = "${google_service_account.cud_service_account.email}"
    }
    software_config {
      python_version = 3
      airflow_config_overrides = {
        update-pypi = "requirements.txt"
      }

      env_variables = {
        project_id                  = "${var.project_id}"
        billing_export_table_name   = "${var.billing_export_table_path}"
        corrected_dataset_id        = "${var.corrected_dataset_id}"
        corrected_table_name        = "${var.corrected_table_name}"
        commitments_table_name      = "${var.commitment_table_path}"
        enable_cud_cost_attribution = "${var.enable_cud_cost_attribution}"
        cud_cost_attribution_option = "${var.cud_cost_attribution_option}"
      }
    }
  }
}


# Upload dependencies folder to DAG folder in Composer Bucket
resource "google_storage_bucket_object" "dag_init_upload" {
  bucket = "${element(split("/dags", element(split("gs://", google_composer_environment.env.config.0.dag_gcs_prefix), 1)), 0)}"
  name   = "dags/dependencies/__init__.py"
  source = "../composer/dependencies/__init__.py"
}

# Upload dependencies folder to DAG folder in Composer Bucket
resource "google_storage_bucket_object" "dag_billingoutput_upload" {
  bucket = "${element(split("/dags", element(split("gs://", google_composer_environment.env.config.0.dag_gcs_prefix), 1)), 0)}"
  name   = "dags/dependencies/billingoutput.py"
  source = "../composer/dependencies/billingoutput.py"
}

# Upload dependencies folder to DAG folder in Composer Bucket
resource "google_storage_bucket_object" "dag_commitment_intervals_upload" {
  bucket = "${element(split("/dags", element(split("gs://", google_composer_environment.env.config.0.dag_gcs_prefix), 1)), 0)}"
  name   = "dags/dependencies/commitment_intervals.py"
  source = "../composer/dependencies/commitment_intervals.py"
}

# Upload dependencies folder to DAG folder in Composer Bucket
resource "google_storage_bucket_object" "dag_commitments_schema_upload" {
  bucket = "${element(split("/dags", element(split("gs://", google_composer_environment.env.config.0.dag_gcs_prefix), 1)), 0)}"
  name   = "dags/dependencies/commitments_schema.py"
  source = "../composer/dependencies/commitments_schema.py"
}

# Upload dependencies folder to DAG folder in Composer Bucket
resource "google_storage_bucket_object" "dag_distribute_commitment_upload" {
  bucket = "${element(split("/dags", element(split("gs://", google_composer_environment.env.config.0.dag_gcs_prefix), 1)), 0)}"
  name   = "dags/dependencies/distribute_commitment.py"
  source = "../composer/dependencies/distribute_commitment.py"
}

# Upload dependencies folder to DAG folder in Composer Bucket
resource "google_storage_bucket_object" "dag_helper_function_upload" {
  bucket = "${element(split("/dags", element(split("gs://", google_composer_environment.env.config.0.dag_gcs_prefix), 1)), 0)}"
  name   = "dags/dependencies/helper_function.py"
  source = "../composer/dependencies/helper_function.py"
}

# Upload dependencies folder to DAG folder in Composer Bucket
resource "google_storage_bucket_object" "dag_project_label_credit_data_upload" {
  bucket = "${element(split("/dags", element(split("gs://", google_composer_environment.env.config.0.dag_gcs_prefix), 1)), 0)}"
  name   = "dags/dependencies/project_label_credit_data.py"
  source = "../composer/dependencies/project_label_credit_data.py"
}

# Upload main.py to DAG folder in Composer Bucket
resource "google_storage_bucket_object" "dag_upload" {
  bucket = "${element(split("/dags", element(split("gs://", google_composer_environment.env.config.0.dag_gcs_prefix), 1)), 0)}"
  name   = "dags/main.py"
  source = "../composer/main.py"
}

# Upload requirements.txt to DAG folder in Composer Bucket
resource "google_storage_bucket_object" "dag_requirements_upload" {
  bucket = "${element(split("/dags", element(split("gs://", google_composer_environment.env.config.0.dag_gcs_prefix), 1)), 0)}"
  name   = "dags/requirements.txt"
  source = "../composer/requirements.txt"
}


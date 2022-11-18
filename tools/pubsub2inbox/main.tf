#   Copyright 2022 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

terraform {
  required_version = ">= 0.13.0"

  required_providers {
    google  = ">= 3.40.0"
    archive = ">= 2.2.0"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_project" "project" {
}

# Secret Manager secret for the function
resource "google_secret_manager_secret" "config-secret" {
  secret_id = var.secret_id != "" ? var.secret_id : var.function_name

  replication {
    automatic = true
  }

  depends_on = [
    google_project_service.secret-manager-api
  ]
}

# Secret version for the function config
resource "google_secret_manager_secret_version" "config-secret-version" {
  secret = google_secret_manager_secret.config-secret.id

  secret_data = var.config != null ? var.config : file(var.config_file)
}

# Service account for running the function
resource "google_service_account" "service-account" {
  account_id   = var.service_account != "" ? var.service_account : var.function_name
  display_name = format("%s Service Account", title(var.service_account))
}

locals {
  # If you specify function_roles, the Terraform code will grant the service account some
  # privileges required for the particular functionalities.

  default_apis = [var.cloud_run ? "run.googleapis.com" : "cloudfunctions.googleapis.com", "cloudbuild.googleapis.com"]

  iam_permissions = {
    scc = {
      org     = ["roles/browser"]
      project = []
      apis    = ["cloudresourcemanager.googleapis.com"]
    }
    scc_writer = {
      org     = ["roles/browser", "roles/securitycenter.findingsEditor", "roles/securitycenter.findingSecurityMarksWriter", "roles/compute.networkViewer"]
      project = []
      apis    = ["cloudresourcemanager.googleapis.com"]
    }
    budgets = {
      org     = ["roles/browser", "roles/billing.viewer"]
      project = []
      apis    = ["cloudresourcemanager.googleapis.com"]
    }
    bigquery_reader = {
      org     = []
      project = ["roles/bigquery.dataViewer", "roles/bigquery.jobUser"]
      apis    = ["bigquery.googleapis.com"]
    }
    bigquery_writer = {
      org     = []
      project = ["roles/bigquery.dataEditor", "roles/bigquery.jobUser"]
      apis    = ["bigquery.googleapis.com"]
    }
    recommender = {
      org     = [/*"roles/recommender.bigQueryCapacityCommitmentsBillingAccountViewer", "roles/recommender.bigQueryCapacityCommitmentsProjectViewer",*/ "roles/recommender.bigQueryCapacityCommitmentsViewer", "roles/recommender.billingAccountCudViewer", "roles/recommender.cloudAssetInsightsViewer", "roles/recommender.cloudsqlViewer", "roles/recommender.computeViewer", "roles/recommender.firewallViewer", "roles/recommender.iamViewer", "roles/recommender.productSuggestionViewer", "roles/recommender.projectCudViewer", "roles/recommender.projectUtilViewer"]
      project = ["roles/compute.viewer"]
      apis    = ["cloudresourcemanager.googleapis.com", "recommender.googleapis.com"]
    }
    monitoring = {
      org     = []
      project = ["roles/monitoring.viewer"]
      apis    = ["cloudresourcemanager.googleapis.com"]
    }
    cai = {
      org     = []
      project = ["roles/cloudasset.viewer"]
      apis    = ["cloudasset.googleapis.com"]
    }
  }
  org_permissions     = flatten([for role in var.function_roles : local.iam_permissions[role].org])
  project_permissions = flatten([for role in var.function_roles : local.iam_permissions[role].project])
  apis                = flatten([for role in var.function_roles : local.iam_permissions[role].apis])
}

# Activate the necessary APIs in the project where the function is running
# (for API quota etc)
resource "google_project_service" "service-account-apis" {
  for_each = toset(concat(local.default_apis, local.apis))
  project  = var.project_id
  service  = each.value

  disable_on_destroy = false
}

# Activate the Secrets Manager API
resource "google_project_service" "secret-manager-api" {
  project            = var.project_id
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

# Add necessary project permissions to the service account in the project
resource "google_project_iam_member" "service-account-project" {
  for_each = toset(concat(["roles/serviceusage.serviceUsageConsumer"], local.project_permissions))
  project  = var.project_id
  role     = each.value
  member   = format("serviceAccount:%s", google_service_account.service-account.email)
}

# Add necessary project permissions to the service account in the organization
resource "google_organization_iam_member" "service-account-org" {
  for_each = toset(local.org_permissions)
  org_id   = var.organization_id
  role     = each.value
  member   = format("serviceAccount:%s", google_service_account.service-account.email)
}

# If a helper bucket is specified, grant the service account permissions to it
resource "google_storage_bucket_iam_member" "service-account-bucket" {
  for_each = toset(var.helper_bucket_name != "" ? ["roles/storage.objectAdmin"] : [])
  bucket   = var.helper_bucket_name
  role     = each.value
  member   = format("serviceAccount:%s", google_service_account.service-account.email)
}

# Allow the service account to create differently scoped tokens
resource "google_service_account_iam_member" "service-account-actas-self" {
  service_account_id = google_service_account.service-account.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = format("serviceAccount:%s", google_service_account.service-account.email)
}

# Allow the service account to access the configuration from the secret
resource "google_secret_manager_secret_iam_member" "config-secret-iam" {
  secret_id = google_secret_manager_secret.config-secret.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = format("serviceAccount:%s", google_service_account.service-account.email)
}

## Cloud Function

resource "random_id" "bucket-suffix" {
  count = !var.cloud_run ? 1 : 0

  byte_length = 8
}

# Bucket for storing the function archive
resource "google_storage_bucket" "function-bucket" {
  count = !var.cloud_run ? 1 : 0

  name                        = format("%s-%s", var.bucket_name, random_id.bucket-suffix[0].hex)
  location                    = var.bucket_location
  uniform_bucket_level_access = true
}

locals {
  function_files       = ["main.py", "requirements.txt", "filters/*.py", "output/*.py", "processors/*.py", "helpers/*.py"]
  all_function_files   = setunion([for glob in local.function_files : fileset(path.module, glob)]...)
  function_file_hashes = [for file_path in local.all_function_files : filemd5(format("%s/%s", path.module, file_path))]
}

data "archive_file" "function-zip" {
  count = !var.cloud_run ? 1 : 0

  type        = "zip"
  output_path = "${path.module}/index.zip"
  dynamic "source" {
    for_each = local.all_function_files
    content {
      content  = file(format("%s/%s", path.module, source.value))
      filename = source.value
    }
  }
}

resource "google_storage_bucket_object" "function-archive" {
  count = !var.cloud_run ? 1 : 0

  name   = format("index-%s.zip", md5(join(",", local.function_file_hashes)))
  bucket = google_storage_bucket.function-bucket[0].name
  source = format("%s/index.zip", path.root)
  depends_on = [
    data.archive_file.function-zip.0
  ]
}

# If you are getting error messages relating to iam.serviceAccount.actAs, see this bug:
# https://github.com/hashicorp/terraform-provider-google/issues/5889
#
# Workaround is to use "terraform taint google_cloudfunctions_function.function"
# before plan/apply.
resource "google_cloudfunctions_function" "function" {
  count = !var.cloud_run ? 1 : 0

  name        = var.function_name
  description = "Pubsub2Inbox"
  runtime     = "python38"

  service_account_email = google_service_account.service-account.email

  available_memory_mb   = 256
  source_archive_bucket = google_storage_bucket.function-bucket[0].name
  source_archive_object = google_storage_bucket_object.function-archive[0].name
  entry_point           = "process_pubsub"
  timeout               = var.function_timeout

  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = var.pubsub_topic
    failure_policy {
      retry = true
    }
  }

  environment_variables = {
    # You could also specify latest secret version here, in case you don't want to redeploy
    # and are fine with the function picking up the new config on subsequent runs.
    CONFIG          = google_secret_manager_secret_version.config-secret-version.name
    LOG_LEVEL       = 10
    SERVICE_ACCOUNT = google_service_account.service-account.email
  }
}

## Cloud Run

# Service account for Pub/Sub invoker
resource "google_service_account" "invoker-service-account" {
  count = var.cloud_run ? 1 : 0

  account_id   = var.service_account != "" ? format("%s-invoker", var.service_account) : format("%s-invoker", var.function_name)
  display_name = format("%s Cloud Run invoker Service Account", title(var.function_name))
}

# Allow the invoker service account to run the Cloud Run function
resource "google_cloud_run_service_iam_member" "pubsub-invoker" {
  count = var.cloud_run ? 1 : 0

  location = google_cloud_run_service.function[0].location
  service  = google_cloud_run_service.function[0].name
  role     = "roles/run.invoker"
  member   = format("serviceAccount:%s", google_service_account.invoker-service-account[0].email)
}

# Grant Pub/Sub P4SA to create auth tokens for the invoker service account
resource "google_service_account_iam_member" "pubsub-token-creator" {
  count = var.cloud_run ? 1 : 0

  service_account_id = google_service_account.invoker-service-account[0].name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = format("serviceAccount:service-%d@gcp-sa-pubsub.iam.gserviceaccount.com", data.google_project.project.number)
}

# Create a Pub/Sub push subscription that calls the Cloud Run function
resource "google_pubsub_subscription" "pubsub-subscription" {
  count = var.cloud_run ? 1 : 0

  name  = format("%s-subscription", var.function_name)
  topic = var.pubsub_topic
  push_config {
    push_endpoint = google_cloud_run_service.function[0].status[0].url
    oidc_token {
      service_account_email = google_service_account.invoker-service-account[0].email
    }
    attributes = {
      x-goog-version = "v1"
    }
  }
  retry_policy {
    minimum_backoff = var.retry_minimum_backoff
    maximum_backoff = var.retry_maximum_backoff
  }
  depends_on = [
    google_service_account_iam_member.pubsub-token-creator[0],
    google_cloud_run_service_iam_member.pubsub-invoker[0]
  ]
}

resource "google_cloud_run_service" "function" {
  count = var.cloud_run ? 1 : 0

  name     = var.function_name
  location = var.region

  template {
    spec {
      containers {
        image = var.cloud_run_container

        env {
          name  = "CONFIG"
          value = google_secret_manager_secret_version.config-secret-version.name
        }
        env {
          name  = "LOG_LEVEL"
          value = 10
        }
        env {
          name  = "SERVICE_ACCOUNT"
          value = google_service_account.service-account.email
        }
      }
      service_account_name  = google_service_account.service-account.email
      container_concurrency = 8
      timeout_seconds       = var.function_timeout
    }
  }
  traffic {
    percent         = 100
    latest_revision = true
  }
}

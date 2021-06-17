# Copyright 2021 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


locals {
  config = yamldecode(file("${path.module}/../../config.yaml"))

  path = "${path.module}/../.."

  sa_project_roles = [
    "roles/bigquery.admin",
    "roles/pubsub.admin",
  ]
  sa_org_roles = [
    "roles/monitoring.admin",
    "roles/resourcemanager.folderViewer",
    "roles/viewer",
  ]
}

provider "google" {
  # Since this will be executed from cloud-shell for credentials use
  # gcloud auth application-default login 

  project = var.project
  region  = var.region
}

# API's and IAM
#...............................................................................
module "project_services" {
  source = "terraform-google-modules/project-factory/google//modules/project_services"

  project_id = var.project

  activate_apis = [
    "bigquery.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "cloudscheduler.googleapis.com",
    "monitoring.googleapis.com",
    "run.googleapis.com"
  ]
}


resource "google_service_account" "quota_export_service_account" {
  account_id   = var.name
  display_name = "Quota Export Service Account"

  depends_on = [module.project_services]
}


resource "google_service_account" "pubsub_invoker_service_account" {
  account_id   = "cloud-run-pubsub-invoker"
  display_name = "Cloud Run Pub/Sub Invoker"

  depends_on = [module.project_services]
}


resource "google_service_account" "scheduler_invoker_service_account" {
  account_id   = "cloud-run-scheduler-invoker"
  display_name = "Cloud Run Scheduler Invoker"

  depends_on = [module.project_services]
}


data "google_iam_policy" "project_policy" {
  binding {
    role = "roles/iam.serviceAccountUser"
    members = [
      "serviceAccount:${resource.google_service_account.quota_export_service_account.email}"
    ]
  }

  binding {
    role = "roles/bigquery.admin"
    members = [
      "serviceAccount:${resource.google_service_account.quota_export_service_account.email}"
    ]
  }

  binding {
    role = "roles/pubsub.admin"
    members = [
      "serviceAccount:${resource.google_service_account.quota_export_service_account.email}"
    ]
  }

  binding {
    role = "roles/run.serviceAgent"

    members = [
      "serviceAccount:service-${var.project_number}@serverless-robot-prod.iam.gserviceaccount.com"
    ]
  }

  binding {
    role = "roles/cloudbuild.serviceAgent"

    members = [
      "serviceAccount:${var.project_number}@cloudbuild.gserviceaccount.com"
    ]
  }

  binding {
    role = "roles/cloudscheduler.serviceAgent"

    members = [
      "serviceAccount:service-${var.project_number}@gcp-sa-cloudscheduler.iam.gserviceaccount.com"
    ]
  }

  binding {
    role = "roles/iam.serviceAccountTokenCreator"

    members = [
      "serviceAccount:service-${var.project_number}@gcp-sa-pubsub.iam.gserviceaccount.com"
    ]
  }

  binding {
    role = "roles/run.invoker"
    members = [
      "serviceAccount:${resource.google_service_account.pubsub_invoker_service_account.email}",
      "serviceAccount:${resource.google_service_account.scheduler_invoker_service_account.email}",
    ]
  }
}


resource "null_resource" "service_accounts" {
  depends_on = [resource.google_service_account.quota_export_service_account,
    resource.google_service_account.pubsub_invoker_service_account,
  resource.google_service_account.scheduler_invoker_service_account, ]
}


resource "google_project_iam_policy" "project_iam" {
  project     = var.project
  policy_data = data.google_iam_policy.project_policy.policy_data

  depends_on = [module.project_services, resource.null_resource.service_accounts]
}


resource "google_organization_iam_member" "sa_org_iam" {
  count = length(local.sa_org_roles)

  org_id = var.org
  role   = local.sa_org_roles[count.index]
  member = "serviceAccount:${resource.google_service_account.quota_export_service_account.email}"

  depends_on = [module.project_services, resource.null_resource.service_accounts]
}


# Local-exec
#...............................................................................
resource "null_resource" "replace_project_id_in_config" {
  provisioner "local-exec" {
    command = "sed -i 's~$PROJECT~'$PROJECT'~g' ${local.path}/config.yaml"
    environment = {
      PROJECT = var.project
    }
  }
}


# Bigquery
#...............................................................................
resource "google_bigquery_dataset" "quota" {
  dataset_id = local.config.export["bigquery"]["dataset"]

  depends_on = [module.project_services,
    resource.google_organization_iam_member.sa_org_iam,
  resource.google_project_iam_policy.project_iam]
}


resource "google_bigquery_table" "metrics" {
  dataset_id = google_bigquery_dataset.quota.dataset_id
  table_id   = "metrics"

  time_partitioning {
    type = "DAY"
  }

  schema = file("${local.path}/bigquery_schemas/metrics")

  depends_on          = [resource.google_bigquery_dataset.quota]
  deletion_protection = false
}


resource "google_bigquery_table" "thresholds" {
  dataset_id = google_bigquery_dataset.quota.dataset_id
  table_id   = "thresholds"

  time_partitioning {
    type = "DAY"
  }

  schema = file("${local.path}/bigquery_schemas/thresholds")

  depends_on          = [resource.google_bigquery_dataset.quota]
  deletion_protection = false
}


resource "null_resource" "replace_project_id" {
  provisioner "local-exec" {
    command = "sed 's~$PROJECT~'$PROJECT'~g' ${local.path}/bigquery_schemas/dashboard_view.sql > ${local.path}/templates/outputs/dashboard_view.sql"
    environment = {
      PROJECT = var.project
    }
  }
}


data "local_file" "dashboard_view_sql" {
  filename = "${local.path}/templates/outputs/dashboard_view.sql"

  depends_on = [resource.null_resource.replace_project_id]
}


resource "google_bigquery_table" "dashboard_view" {
  dataset_id = local.config.export["bigquery"]["dataset"]
  table_id   = "dashboard_view"

  view {
    query          = data.local_file.dashboard_view_sql.content
    use_legacy_sql = "false"
  }

  depends_on = [resource.google_bigquery_dataset.quota,
    resource.google_bigquery_table.metrics,
  resource.google_bigquery_table.thresholds]
  deletion_protection = false
}


# Cloud Run
#...............................................................................
resource "null_resource" "build" {
  provisioner "local-exec" {
    command = "gcloud builds submit ${local.path} --tag gcr.io/$PROJECT/$SERVICE"

    environment = {
      PROJECT = var.project
      SERVICE = var.name
    }
  }

  depends_on = [module.project_services,
    resource.google_organization_iam_member.sa_org_iam,
  resource.google_project_iam_policy.project_iam]
}


resource "google_cloud_run_service" "crun" {
  name     = var.name
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project}/${var.name}"
      }

      container_concurrency = 5
      service_account_name  = "${var.name}@${var.project}.iam.gserviceaccount.com"
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [resource.null_resource.build]
}


# PubSub
#...............................................................................
resource "null_resource" "pubsub" {

  depends_on = [module.project_services,
    resource.google_organization_iam_member.sa_org_iam,
  resource.google_project_iam_policy.project_iam]

}


resource "google_pubsub_topic" "dead_letter" {
  name = "dead-letter"

  depends_on = [resource.null_resource.pubsub]
}


resource "google_pubsub_topic" "metrics" {
  name = "metrics"

  depends_on = [resource.null_resource.pubsub]
}


resource "google_pubsub_topic" "thresholds" {
  name = "thresholds"

  depends_on = [resource.null_resource.pubsub]
}


resource "google_pubsub_topic" "bigquery" {
  name = "bigquery"

  depends_on = [resource.null_resource.pubsub]
}


resource "google_pubsub_subscription" "metrics_sub" {
  name  = "metrics_sub"
  topic = resource.google_pubsub_topic.metrics.name

  ack_deadline_seconds       = 60
  message_retention_duration = "900s"

  push_config {
    push_endpoint = "${resource.google_cloud_run_service.crun.status[0].url}/project/metric/list"
    oidc_token {
      service_account_email = resource.google_service_account.pubsub_invoker_service_account.email
    }
  }

  retry_policy {
    minimum_backoff = "60s"
  }

  dead_letter_policy {
    dead_letter_topic     = resource.google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  depends_on = [resource.null_resource.pubsub]
}


resource "google_pubsub_subscription" "thresholds_sub" {
  name  = "thresholds_sub"
  topic = resource.google_pubsub_topic.thresholds.name

  ack_deadline_seconds       = 60
  message_retention_duration = "900s"

  push_config {
    push_endpoint = "${resource.google_cloud_run_service.crun.status[0].url}/project/metric/threshold/list"
    oidc_token {
      service_account_email = resource.google_service_account.pubsub_invoker_service_account.email
    }
  }

  retry_policy {
    minimum_backoff = "60s"
  }

  dead_letter_policy {
    dead_letter_topic     = resource.google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  depends_on = [resource.null_resource.pubsub]
}


resource "google_pubsub_subscription" "bigquery_sub" {
  name  = "bigquery_sub"
  topic = resource.google_pubsub_topic.bigquery.name

  ack_deadline_seconds       = 60
  message_retention_duration = "900s"

  push_config {
    push_endpoint = "${resource.google_cloud_run_service.crun.status[0].url}/project/metric/save"
    oidc_token {
      service_account_email = resource.google_service_account.pubsub_invoker_service_account.email
    }
  }

  retry_policy {
    minimum_backoff = "60s"
  }

  dead_letter_policy {
    dead_letter_topic     = resource.google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  depends_on = [resource.null_resource.pubsub]
}


# Scheduler
#...............................................................................
resource "null_resource" "scheduler" {

  depends_on = [module.project_services,
    resource.google_organization_iam_member.sa_org_iam,
  resource.google_project_iam_policy.project_iam]

}


resource "google_cloud_scheduler_job" "quota_export_job" {
  name             = "${var.name}-job"
  description      = "Job to trigger Quota export to BigQuery"
  schedule         = "0 */12 * * *"
  attempt_deadline = "320s"

  retry_config {
    retry_count = 1
  }

  http_target {
    http_method = "GET"
    uri         = "${resource.google_cloud_run_service.crun.status[0].url}/project/list"

    oidc_token {
      service_account_email = resource.google_service_account.scheduler_invoker_service_account.email
      audience              = "${resource.google_cloud_run_service.crun.status[0].url}/project/list"
    }
  }

  depends_on = [resource.null_resource.scheduler]
}


resource "google_cloud_scheduler_job" "quota_export_thresholds_job" {
  name             = "${var.name}-thresholds-job"
  description      = "Job to trigger Quota thresholds check"
  schedule         = "30 */12 * * *"
  attempt_deadline = "320s"

  retry_config {
    retry_count = 1
  }

  http_target {
    http_method = "GET"
    uri         = "${resource.google_cloud_run_service.crun.status[0].url}/report/thresholds"

    oidc_token {
      service_account_email = resource.google_service_account.scheduler_invoker_service_account.email
      audience              = "${resource.google_cloud_run_service.crun.status[0].url}/report/thresholds"
    }
  }

  depends_on = [resource.null_resource.scheduler]
}

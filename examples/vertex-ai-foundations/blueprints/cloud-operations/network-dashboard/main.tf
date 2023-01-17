/**
 * Copyright 2022 Google LLC
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
  project_ids = toset(var.monitored_projects_list)
  projects    = join(",", local.project_ids)

  folder_ids         = toset(var.monitored_folders_list)
  folders            = join(",", local.folder_ids)
  monitoring_project = var.monitoring_project_id == "" ? module.project-monitoring[0].project_id : var.monitoring_project_id
}

################################################
# Monitoring project creation                  #
################################################

module "project-monitoring" {
  count           = var.monitoring_project_id == "" ? 1 : 0
  source          = "../../../modules/project"
  name            = "monitoring"
  parent          = "organizations/${var.organization_id}"
  prefix          = var.prefix
  billing_account = var.billing_account
  services        = var.project_monitoring_services
}

################################################
# Service account creation and IAM permissions #
################################################

module "service-account-function" {
  source       = "../../../modules/iam-service-account"
  project_id   = local.monitoring_project
  name         = "sa-dash"
  generate_key = false

  # Required IAM permissions for this service account are:
  # 1) compute.networkViewer on projects to be monitored (I gave it at organization level for now for simplicity)
  # 2) monitoring viewer on the projects to be monitored (I gave it at organization level for now for simplicity)

  iam_organization_roles = {
    "${var.organization_id}" = [
      "roles/compute.networkViewer",
      "roles/monitoring.viewer",
      "roles/cloudasset.viewer"
    ]
  }

  iam_project_roles = {
    "${local.monitoring_project}" = [
      "roles/monitoring.metricWriter",
    ]
  }
}

module "service-account-scheduler" {
  source       = "../../../modules/iam-service-account"
  project_id   = local.monitoring_project
  name         = "sa-scheduler"
  generate_key = false

  iam_project_roles = {
    "${local.monitoring_project}" = [
      "roles/run.invoker",
      "roles/cloudfunctions.invoker"
    ]
  }
}

################################################
# Cloud Function configuration (& Scheduler)   #
# you can comment out  the pub/sub call in case of 2nd generation function
################################################

module "pubsub" {

  source     = "../../../modules/pubsub"
  project_id = local.monitoring_project
  name       = "network-dashboard-pubsub"
  subscriptions = {
    "network-dashboard-pubsub-default" = null
  }
  # the Cloud Scheduler robot service account already has pubsub.topics.publish
  # at the project level via roles/cloudscheduler.serviceAgent
}

resource "google_cloud_scheduler_job" "job" {
  count     = var.cf_version == "V2" ? 0 : 1
  project   = local.monitoring_project
  region    = var.region
  name      = "network-dashboard-scheduler"
  schedule  = var.schedule_cron
  time_zone = "UTC"

  pubsub_target {
    topic_name = module.pubsub.topic.id
    data       = base64encode("test")
  }
}
#http trigger for 2nd generation function

resource "google_cloud_scheduler_job" "job_httptrigger" {
  count     = var.cf_version == "V2" ? 1 : 0
  project   = local.monitoring_project
  region    = var.region
  name      = "network-dashboard-scheduler"
  schedule  = var.schedule_cron
  time_zone = "UTC"

  http_target {
    http_method = "POST"
    uri         = module.cloud-function.uri

    oidc_token {
      service_account_email = module.service-account-scheduler.email
    }
  }
}

module "cloud-function" {
  v2          = var.cf_version == "V2"
  source      = "../../../modules/cloud-function"
  project_id  = local.monitoring_project
  name        = "network-dashboard-cloud-function"
  bucket_name = "${local.monitoring_project}-network-dashboard-bucket"
  bucket_config = {
    location             = var.region
    lifecycle_delete_age = null
  }
  region = var.region

  bundle_config = {
    source_dir  = "cloud-function"
    output_path = "cloud-function.zip"
    excludes    = null
  }

  function_config = {
    timeout     = 480 # Timeout in seconds, increase it if your CF timeouts and use v2 if > 9 minutes.
    entry_point = "main"
    runtime     = "python39"
    instances   = 1
    memory      = 256 # Memory in MB

  }

  environment_variables = {
    MONITORED_PROJECTS_LIST = local.projects
    MONITORED_FOLDERS_LIST  = local.folders
    MONITORING_PROJECT_ID   = local.monitoring_project
    ORGANIZATION_ID         = var.organization_id
    CF_VERSION              = var.cf_version
  }

  service_account = module.service-account-function.email
  # Internal only doesn't seem to work with CFv2:
  ingress_settings = var.cf_version == "V2" ? "ALLOW_ALL" : "ALLOW_INTERNAL_ONLY"

  trigger_config = {
    event    = "google.pubsub.topic.publish"
    resource = module.pubsub.topic.id
    retry    = null
  }
}

################################################
# Cloud Monitoring Dashboard creation          #
################################################

resource "google_monitoring_dashboard" "dashboard" {
  dashboard_json = file("${path.module}/dashboards/quotas-utilization.json")
  project        = local.monitoring_project
}

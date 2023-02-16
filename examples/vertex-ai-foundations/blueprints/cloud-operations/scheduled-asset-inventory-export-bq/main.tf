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



###############################################################################
#                                Projects                                     #
###############################################################################

module "project" {
  source          = "../../../modules/project"
  name            = var.project_id
  parent          = var.root_node
  billing_account = try(var.billing_account, null)
  project_create  = var.project_create
  services = [
    "bigquery.googleapis.com",
    "cloudasset.googleapis.com",
    "compute.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudscheduler.googleapis.com",
    "pubsub.googleapis.com"
  ]
  iam = {
    "roles/resourcemanager.projectIamAdmin" = ["serviceAccount:${module.project.service_accounts.robots.cloudasset}"]
    "roles/bigquery.dataEditor"             = ["serviceAccount:${module.project.service_accounts.robots.cloudasset}"]
    "roles/bigquery.user"                   = ["serviceAccount:${module.project.service_accounts.robots.cloudasset}"]
  }
}

module "service-account" {
  source     = "../../../modules/iam-service-account"
  project_id = module.project.project_id
  name       = "${var.name}-cf"
  iam_project_roles = {
    (var.project_id) = [
      "roles/cloudasset.owner",
      "roles/bigquery.jobUser"
    ]
  }
}

###############################################################################
#                                Pub/Sub                                      #
###############################################################################

module "pubsub" {
  source     = "../../../modules/pubsub"
  project_id = module.project.project_id
  name       = var.name
  subscriptions = {
    "${var.name}-default" = null
  }
  # the Cloud Scheduler robot service account already has pubsub.topics.publish
  # at the project level via roles/cloudscheduler.serviceAgent
}

module "pubsub_file" {
  source     = "../../../modules/pubsub"
  project_id = module.project.project_id
  name       = var.name_cffile
  subscriptions = {
    "${var.name_cffile}-default" = null
  }
  # the Cloud Scheduler robot service account already has pubsub.topics.publish
  # at the project level via roles/cloudscheduler.serviceAgent
}

###############################################################################
#                             Cloud Function                                  #
###############################################################################

module "cf" {
  source      = "../../../modules/cloud-function"
  project_id  = module.project.project_id
  region      = var.region
  name        = var.name
  bucket_name = "${var.name}-${random_pet.random.id}"
  bucket_config = {
    location             = var.region
    lifecycle_delete_age = null
  }
  bundle_config = {
    source_dir  = "cf"
    output_path = var.bundle_path
    excludes    = null
  }
  service_account = module.service-account.email
  trigger_config = {
    event    = "google.pubsub.topic.publish"
    resource = module.pubsub.topic.id
    retry    = null
  }
}

module "cffile" {
  count       = var.cai_gcs_export ? 1 : 0
  source      = "../../../modules/cloud-function"
  project_id  = module.project.project_id
  region      = var.region
  name        = var.name_cffile
  bucket_name = "${var.name_cffile}-${random_pet.random.id}"
  bucket_config = {
    location             = var.region
    lifecycle_delete_age = null
  }
  bundle_config = {
    source_dir  = "cffile"
    output_path = var.bundle_path_cffile
    excludes    = null
  }
  service_account = module.service-account.email
  trigger_config = {
    event    = "google.pubsub.topic.publish"
    resource = module.pubsub_file.topic.id
    retry    = null
  }
}

resource "random_pet" "random" {
  length = 1
}

###############################################################################
#                            Cloud Scheduler                                  #
###############################################################################

resource "google_app_engine_application" "app" {
  project     = module.project.project_id
  location_id = var.location
}

resource "google_cloud_scheduler_job" "job" {
  project     = google_app_engine_application.app.project
  region      = var.region
  name        = "cai-export-job"
  description = "CAI Export Job."
  schedule    = "* 9 * * 1"
  time_zone   = "Etc/UTC"

  pubsub_target {
    attributes = {}
    topic_name = module.pubsub.topic.id
    data = base64encode(jsonencode({
      project            = module.project.project_id
      bq_project         = module.project.project_id
      bq_dataset         = var.cai_config.bq_dataset
      bq_table           = var.cai_config.bq_table
      bq_table_overwrite = var.cai_config.bq_table_overwrite
      target_node        = var.cai_config.target_node
    }))
  }
}

resource "google_cloud_scheduler_job" "job_file" {
  count       = var.cai_gcs_export ? 1 : 0
  project     = google_app_engine_application.app.project
  region      = var.region
  name        = "file-export-job"
  description = "File export from BQ Job."
  schedule    = "* 9 * * 1"
  time_zone   = "Etc/UTC"

  pubsub_target {
    attributes = {}
    topic_name = module.pubsub_file.topic.id
    data = base64encode(jsonencode({
      bucket     = var.file_config.bucket
      filename   = var.file_config.filename
      format     = var.file_config.format
      bq_dataset = var.file_config.bq_dataset
      bq_table   = var.file_config.bq_table
    }))
  }
}

###############################################################################
#                                Bigquery                                     #
###############################################################################

module "bq" {
  source     = "../../../modules/bigquery-dataset"
  project_id = module.project.project_id
  id         = var.cai_config.bq_dataset
  location   = var.region
  access = {
    owner = { role = "OWNER", type = "user" }
  }
  access_identities = {
    owner = module.service-account.email
  }
  options = {
    default_table_expiration_ms     = null
    default_partition_expiration_ms = null
    delete_contents_on_destroy      = true
  }
}

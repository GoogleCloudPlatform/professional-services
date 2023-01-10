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


###############################################################################
#                                Project                                      #
###############################################################################

module "project" {
  source          = "../../../modules/project"
  name            = var.project_id
  parent          = var.root_node
  billing_account = var.billing_account
  project_create  = var.project_create
  services = [
    "vpcaccess.googleapis.com",
    "compute.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudscheduler.googleapis.com",
    "pubsub.googleapis.com"
  ]
}

###############################################################################
#                                   Network                                   #
###############################################################################

module "vpc" {
  source     = "../../../modules/net-vpc"
  project_id = module.project.project_id
  name       = "vpc"
  subnets = [
    {
      name          = "apps"
      ip_cidr_range = "10.8.32.0/24"
      region        = var.region
    }
  ]
}

module "firewall" {
  source     = "../../../modules/net-vpc-firewall"
  project_id = module.project.project_id
  network    = module.vpc.name
}

###############################################################################
#                               Service Accounts                              #
###############################################################################

module "service-account-healthchecker" {
  source     = "../../../modules/iam-service-account"
  project_id = module.project.project_id
  name       = "healthckecker-cf"
  iam_project_roles = {
    (var.project_id) = [
      "roles/compute.viewer",
      "roles/logging.logWriter"
    ]
  }
}

module "service-account-restarter" {
  source     = "../../../modules/iam-service-account"
  project_id = module.project.project_id
  name       = "restarter-cf"
  iam_project_roles = {
    (var.project_id) = [
      "roles/compute.instanceAdmin",
      "roles/logging.logWriter"
    ]
  }
}

module "service-account-scheduler" {
  source     = "../../../modules/iam-service-account"
  project_id = module.project.project_id
  name       = "cloud-scheduler"
}

###############################################################################
#                                Pub/Sub                                      #
###############################################################################

module "pubsub" {
  source     = "../../../modules/pubsub"
  project_id = module.project.project_id
  name       = "restarter"
  iam = {
    "roles/pubsub.publisher" = [module.service-account-healthchecker.iam_email]
  }
}

###############################################################################
#                             Cloud Function                                  #
###############################################################################

module "cf-restarter" {
  source      = "../../../modules/cloud-function"
  project_id  = module.project.project_id
  name        = "cf-restarter"
  region      = var.region
  bucket_name = "cf-bundle-bucket-${random_pet.random.id}"
  bucket_config = {
    location             = var.region
    lifecycle_delete_age = null
  }
  bundle_config = {
    source_dir  = "${path.module}/function/restarter"
    output_path = "restarter.zip"
    excludes    = []
  }
  service_account = module.service-account-restarter.email

  function_config = {
    entry_point      = "RestartInstance"
    ingress_settings = null
    instances        = 1
    memory           = 256
    runtime          = "go116"
    timeout          = 300
  }

  trigger_config = {
    event    = "google.pubsub.topic.publish"
    resource = module.pubsub.topic.id
    retry    = null
  }

}

module "cf-healthchecker" {
  source      = "../../../modules/cloud-function"
  project_id  = module.project.project_id
  name        = "cf-healthchecker"
  region      = var.region
  bucket_name = module.cf-restarter.bucket_name

  bundle_config = {
    source_dir  = "${path.module}/function/healthchecker"
    output_path = "healthchecker.zip"
    excludes    = []
  }
  service_account = module.service-account-healthchecker.email

  function_config = {
    entry_point      = "HealthCheck"
    ingress_settings = null
    instances        = 1
    memory           = 256
    runtime          = "go116"
    timeout          = 300
  }

  environment_variables = {
    FILTER       = "name = nginx-*"
    GRACE_PERIOD = var.grace_period
    PROJECT      = module.project.project_id
    PUBSUB_TOPIC = module.pubsub.topic.name
    REGION       = var.region
    TCP_PORT     = var.tcp_port
    TIMEOUT      = var.timeout
  }

  vpc_connector = {
    create          = true
    name            = "hc-connector"
    egress_settings = "PRIVATE_RANGES_ONLY"

  }

  vpc_connector_config = {
    ip_cidr_range = "10.132.0.0/28"
    network       = "vpc"
  }

  iam = {
    "roles/cloudfunctions.invoker" = [module.service-account-scheduler.iam_email]
  }

  depends_on = [
    module.vpc
  ]
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

resource "google_cloud_scheduler_job" "healthcheck-job" {
  project     = google_app_engine_application.app.project
  region      = var.region
  name        = "healthchecker-schedule"
  description = "Execute Compute Instance Healthcheck CF"
  schedule    = var.schedule
  time_zone   = "Etc/UTC"

  http_target {
    http_method = "GET"
    uri         = module.cf-healthchecker.function.https_trigger_url

    oidc_token {
      service_account_email = module.service-account-scheduler.email
    }
  }
}

###############################################################################
#                             Test Nginx Instance                             #
###############################################################################

module "cos-nginx" {
  source = "../../../modules/cloud-config-container/nginx"
  test_instance = {
    project_id = module.project.project_id
    zone       = "${var.region}-b"
    name       = "nginx-test"
    type       = "f1-micro"
    network    = module.vpc.self_link
    subnetwork = module.vpc.subnet_self_links["${var.region}/apps"]
  }
  test_instance_defaults = {
    disks    = {}
    image    = null
    metadata = {}
    nat      = false
    service_account_roles = [
      "roles/logging.logWriter",
      "roles/monitoring.metricWriter"
    ]
    tags = ["ssh"]
  }
}

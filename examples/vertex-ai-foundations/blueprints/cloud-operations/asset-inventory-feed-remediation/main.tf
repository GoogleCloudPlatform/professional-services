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
  role_id   = "projects/${var.project_id}/roles/${local.role_name}"
  role_name = "feeds_cf"
}

module "project" {
  source         = "../../../modules/project"
  name           = var.project_id
  project_create = var.project_create
  services = [
    "cloudasset.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudfunctions.googleapis.com",
    "compute.googleapis.com"
  ]
  custom_roles = {
    (local.role_name) = [
      "compute.instances.list",
      "compute.instances.setTags",
      "compute.zones.list",
      "compute.zoneOperations.get",
      "compute.zoneOperations.list"
    ]
  }
  iam = {
    (local.role_id) = [module.service-account.iam_email]
  }
}

module "vpc" {
  source     = "../../../modules/net-vpc"
  project_id = module.project.project_id
  name       = var.name
  subnets = [{
    ip_cidr_range = "192.168.0.0/24"
    name          = "${var.name}-default"
    region        = var.region
  }]
}

module "pubsub" {
  source        = "../../../modules/pubsub"
  project_id    = module.project.project_id
  name          = var.name
  subscriptions = { "${var.name}-default" = null }
  iam = {
    "roles/pubsub.publisher" = [
      "serviceAccount:${module.project.service_accounts.robots.cloudasset}"
    ]
  }
}

module "service-account" {
  source     = "../../../modules/iam-service-account"
  project_id = module.project.project_id
  name       = "${var.name}-cf"
  # iam_project_roles = { (module.project.project_id) = [local.role_id] }
}

module "cf" {
  source      = "../../../modules/cloud-function"
  project_id  = module.project.project_id
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

module "simple-vm-example" {
  source     = "../../../modules/compute-vm"
  project_id = module.project.project_id
  zone       = "${var.region}-b"
  name       = var.name
  network_interfaces = [{
    network    = module.vpc.self_link
    subnetwork = try(module.vpc.subnet_self_links["${var.region}/${var.name}-default"], "")
  }]
  tags = ["${var.project_id}-test-feed", "shared-test-feed"]
}

resource "random_pet" "random" {
  length = 1
}

# Create a feed that sends notifications about instance  updates.
resource "google_cloud_asset_project_feed" "project_feed" {
  project      = module.project.project_id
  feed_id      = var.name
  content_type = "RESOURCE"
  asset_types  = ["compute.googleapis.com/Instance"]

  feed_output_config {
    pubsub_destination {
      topic = module.pubsub.topic.id
    }
  }
}

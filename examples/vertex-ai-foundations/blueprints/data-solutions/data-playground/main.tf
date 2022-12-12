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
#                                   Project                                   #
###############################################################################
locals {
  service_encryption_keys = var.service_encryption_keys
}

module "project" {
  source          = "../../../modules/project"
  name            = var.project_id
  parent          = try(var.project_create.parent, null)
  billing_account = try(var.project_create.billing_account_id, null)
  project_create  = var.project_create != null
  prefix          = var.project_create == null ? null : var.prefix
  services = [
    "bigquery.googleapis.com",
    "bigquerystorage.googleapis.com",
    "bigqueryreservation.googleapis.com",
    "composer.googleapis.com",
    "compute.googleapis.com",
    "dataflow.googleapis.com",
    "ml.googleapis.com",
    "notebooks.googleapis.com",
    "orgpolicy.googleapis.com",
    "servicenetworking.googleapis.com",
    "stackdriver.googleapis.com",
    "storage.googleapis.com",
    "storage-component.googleapis.com"
  ]
  org_policies = {
    # "constraints/compute.requireOsLogin" = {
    #   enforce = false
    # }
    # Example of applying a project wide policy, mainly useful for Composer
  }
  service_encryption_key_ids = {
    compute = [try(local.service_encryption_keys.compute, null)]
    bq      = [try(local.service_encryption_keys.bq, null)]
    storage = [try(local.service_encryption_keys.storage, null)]
  }
}

###############################################################################
#                                Networking                                   #
###############################################################################

module "vpc" {
  source     = "../../../modules/net-vpc"
  project_id = module.project.project_id
  name       = "${var.prefix}-vpc"
  subnets = [
    {
      ip_cidr_range = var.vpc_config.ip_cidr_range
      name          = "${var.prefix}-subnet"
      region        = var.region
    }
  ]
}

module "vpc-firewall" {
  source     = "../../../modules/net-vpc-firewall"
  project_id = module.project.project_id
  network    = module.vpc.name
  default_rules_config = {
    admin_ranges = [var.vpc_config.ip_cidr_range]
  }
  ingress_rules = {
    #TODO Remove and rely on 'ssh' tag once terraform-provider-google/issues/9273 is fixed
    ("${var.prefix}-iap") = {
      description   = "Enable SSH from IAP on Notebooks."
      source_ranges = ["35.235.240.0/20"]
      targets       = ["notebook-instance"]
      rules         = [{ protocol = "tcp", ports = [22] }]
    }
  }
}

module "cloudnat" {
  source         = "../../../modules/net-cloudnat"
  project_id     = module.project.project_id
  name           = "${var.prefix}-default"
  region         = var.region
  router_network = module.vpc.name
}

###############################################################################
#                              Storage                                        #
###############################################################################

module "bucket" {
  source         = "../../../modules/gcs"
  project_id     = module.project.project_id
  prefix         = var.prefix
  location       = var.location
  name           = "data"
  encryption_key = try(local.service_encryption_keys.storage, null) # Example assignment of an encryption key
}

module "dataset" {
  source         = "../../../modules/bigquery-dataset"
  project_id     = module.project.project_id
  id             = "${var.prefix}_data"
  encryption_key = try(local.service_encryption_keys.bq, null) # Example assignment of an encryption key
}

###############################################################################
#                         Vertex AI Notebook                                   #
###############################################################################
# TODO: Add encryption_key to Vertex AI notebooks as well
# TODO: Add shared VPC support

module "service-account-notebook" {
  source     = "../../../modules/iam-service-account"
  project_id = module.project.project_id
  name       = "notebook-sa"
  iam_project_roles = {
    (module.project.project_id) = [
      "roles/bigquery.admin",
      "roles/bigquery.jobUser",
      "roles/bigquery.dataEditor",
      "roles/bigquery.user",
      "roles/storage.admin",
    ]
  }
}

resource "google_notebooks_instance" "playground" {
  name         = "${var.prefix}-notebook"
  location     = format("%s-%s", var.region, "b")
  machine_type = "e2-medium"
  project      = module.project.project_id

  container_image {
    repository = "gcr.io/deeplearning-platform-release/base-cpu"
    tag        = "latest"
  }

  install_gpu_driver = true
  boot_disk_type     = "PD_SSD"
  boot_disk_size_gb  = 110
  disk_encryption    = try(local.service_encryption_keys.compute != null, false) ? "CMEK" : "GMEK"
  kms_key            = try(local.service_encryption_keys.compute, null)

  no_public_ip    = true
  no_proxy_access = false

  network = module.vpc.network.id
  subnet  = module.vpc.subnets[format("%s/%s", var.region, "${var.prefix}-subnet")].id

  service_account = module.service-account-notebook.email

  #TODO Uncomment once terraform-provider-google/issues/9273 is fixed
  # tags = ["ssh"]
}

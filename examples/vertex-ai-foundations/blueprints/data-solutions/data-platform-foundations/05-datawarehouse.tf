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

# tfdoc:file:description Data Warehouse projects.

locals {
  dwh_group_iam = {
    (local.groups.data-engineers) = [
      "roles/bigquery.dataEditor",
      "roles/storage.admin",
    ],
    (local.groups.data-analysts) = [
      "roles/bigquery.dataViewer",
      "roles/bigquery.jobUser",
      "roles/bigquery.metadataViewer",
      "roles/bigquery.user",
      "roles/datacatalog.viewer",
      "roles/datacatalog.tagTemplateViewer",
      "roles/storage.objectViewer",
    ]
  }
  dwh_plg_group_iam = {
    (local.groups.data-engineers) = [
      "roles/bigquery.dataEditor",
      "roles/storage.admin",
    ],
    (local.groups.data-analysts) = [
      "roles/bigquery.dataEditor",
      "roles/bigquery.jobUser",
      "roles/bigquery.metadataViewer",
      "roles/bigquery.user",
      "roles/datacatalog.viewer",
      "roles/datacatalog.tagTemplateViewer",
      "roles/storage.objectAdmin",
    ]
  }
  dwh_lnd_iam = {
    "roles/bigquery.dataOwner" = [
      module.load-sa-df-0.iam_email,
      module.transf-sa-df-0.iam_email,
      module.transf-sa-bq-0.iam_email,
    ]
    "roles/bigquery.jobUser" = [
      module.load-sa-df-0.iam_email,
    ]
    "roles/datacatalog.categoryAdmin" = [
      module.transf-sa-bq-0.iam_email
    ]
    "roles/storage.objectCreator" = [
      module.load-sa-df-0.iam_email,
    ]
  }
  dwh_iam = {
    "roles/bigquery.dataOwner" = [
      module.transf-sa-df-0.iam_email,
      module.transf-sa-bq-0.iam_email,
    ]
    "roles/bigquery.jobUser" = [
      module.transf-sa-bq-0.iam_email,
    ]
    "roles/datacatalog.categoryAdmin" = [
      module.load-sa-df-0.iam_email
    ]
    "roles/storage.objectCreator" = [
      module.transf-sa-df-0.iam_email,
    ]
    "roles/storage.objectViewer" = [
      module.transf-sa-df-0.iam_email,
    ]
  }
  dwh_services = concat(var.project_services, [
    "bigquery.googleapis.com",
    "bigqueryreservation.googleapis.com",
    "bigquerystorage.googleapis.com",
    "cloudkms.googleapis.com",
    "compute.googleapis.com",
    "dataflow.googleapis.com",
    "pubsub.googleapis.com",
    "servicenetworking.googleapis.com",
    "storage.googleapis.com",
    "storage-component.googleapis.com"
  ])
}

# Project

module "dwh-lnd-project" {
  source          = "../../../modules/project"
  parent          = var.folder_id
  billing_account = var.billing_account_id
  prefix          = var.prefix
  name            = "dwh-lnd${local.project_suffix}"
  group_iam       = local.dwh_group_iam
  iam             = local.dwh_lnd_iam
  services        = local.dwh_services
  service_encryption_key_ids = {
    bq      = [try(local.service_encryption_keys.bq, null)]
    storage = [try(local.service_encryption_keys.storage, null)]
  }
}

module "dwh-cur-project" {
  source          = "../../../modules/project"
  parent          = var.folder_id
  billing_account = var.billing_account_id
  prefix          = var.prefix
  name            = "dwh-cur${local.project_suffix}"
  group_iam       = local.dwh_group_iam
  iam             = local.dwh_iam
  services        = local.dwh_services
  service_encryption_key_ids = {
    bq      = [try(local.service_encryption_keys.bq, null)]
    storage = [try(local.service_encryption_keys.storage, null)]
  }
}

module "dwh-conf-project" {
  source          = "../../../modules/project"
  parent          = var.folder_id
  billing_account = var.billing_account_id
  prefix          = var.prefix
  name            = "dwh-conf${local.project_suffix}"
  group_iam       = local.dwh_group_iam
  iam             = local.dwh_iam
  services        = local.dwh_services
  service_encryption_key_ids = {
    bq      = [try(local.service_encryption_keys.bq, null)]
    storage = [try(local.service_encryption_keys.storage, null)]
  }
}

module "dwh-plg-project" {
  source          = "../../../modules/project"
  parent          = var.folder_id
  billing_account = var.billing_account_id
  prefix          = var.prefix
  name            = "dwh-plg${local.project_suffix}"
  group_iam       = local.dwh_plg_group_iam
  iam             = {}
  services        = local.dwh_services
  service_encryption_key_ids = {
    bq      = [try(local.service_encryption_keys.bq, null)]
    storage = [try(local.service_encryption_keys.storage, null)]
  }
}

# Bigquery

module "dwh-lnd-bq-0" {
  source         = "../../../modules/bigquery-dataset"
  project_id     = module.dwh-lnd-project.project_id
  id             = "${replace(var.prefix, "-", "_")}_dwh_lnd_bq_0"
  location       = var.location
  encryption_key = try(local.service_encryption_keys.bq, null)
}

module "dwh-cur-bq-0" {
  source         = "../../../modules/bigquery-dataset"
  project_id     = module.dwh-cur-project.project_id
  id             = "${replace(var.prefix, "-", "_")}_dwh_lnd_bq_0"
  location       = var.location
  encryption_key = try(local.service_encryption_keys.bq, null)
}

module "dwh-conf-bq-0" {
  source         = "../../../modules/bigquery-dataset"
  project_id     = module.dwh-conf-project.project_id
  id             = "${replace(var.prefix, "-", "_")}_dwh_conf_bq_0"
  location       = var.location
  encryption_key = try(local.service_encryption_keys.bq, null)
}

module "dwh-plg-bq-0" {
  source         = "../../../modules/bigquery-dataset"
  project_id     = module.dwh-plg-project.project_id
  id             = "${replace(var.prefix, "-", "_")}_dwh_plg_bq_0"
  location       = var.location
  encryption_key = try(local.service_encryption_keys.bq, null)
}

# Cloud storage

module "dwh-lnd-cs-0" {
  source         = "../../../modules/gcs"
  project_id     = module.dwh-lnd-project.project_id
  prefix         = var.prefix
  name           = "dwh-lnd-cs-0"
  location       = var.location
  storage_class  = "MULTI_REGIONAL"
  encryption_key = try(local.service_encryption_keys.storage, null)
  force_destroy  = var.data_force_destroy
}

module "dwh-cur-cs-0" {
  source         = "../../../modules/gcs"
  project_id     = module.dwh-cur-project.project_id
  prefix         = var.prefix
  name           = "dwh-cur-cs-0"
  location       = var.location
  storage_class  = "MULTI_REGIONAL"
  encryption_key = try(local.service_encryption_keys.storage, null)
  force_destroy  = var.data_force_destroy
}

module "dwh-conf-cs-0" {
  source         = "../../../modules/gcs"
  project_id     = module.dwh-conf-project.project_id
  prefix         = var.prefix
  name           = "dwh-conf-cs-0"
  location       = var.location
  storage_class  = "MULTI_REGIONAL"
  encryption_key = try(local.service_encryption_keys.storage, null)
  force_destroy  = var.data_force_destroy
}

module "dwh-plg-cs-0" {
  source         = "../../../modules/gcs"
  project_id     = module.dwh-plg-project.project_id
  prefix         = var.prefix
  name           = "dwh-plg-cs-0"
  location       = var.location
  storage_class  = "MULTI_REGIONAL"
  encryption_key = try(local.service_encryption_keys.storage, null)
  force_destroy  = var.data_force_destroy
}

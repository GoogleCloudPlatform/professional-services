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

# tfdoc:file:description Project resources.

locals {
  np_service_account_iam_email = [
    for k, v in module.cluster_nodepools : v.service_account_iam_email
  ]
}

module "host_project" {
  source          = "../../../modules/project"
  billing_account = var.billing_account_id
  parent          = var.parent
  name            = var.host_project_id
  shared_vpc_host_config = {
    enabled = true
  }
  services = [
    "container.googleapis.com"
  ]
}

module "mgmt_project" {
  source          = "../../../modules/project"
  billing_account = var.billing_account_id
  parent          = var.parent
  name            = var.mgmt_project_id
  shared_vpc_service_config = {
    attach               = true
    host_project         = module.host_project.project_id
    service_identity_iam = null
  }
  services = [
    "cloudresourcemanager.googleapis.com",
    "container.googleapis.com",
    "serviceusage.googleapis.com"
  ]
}

module "fleet_project" {
  source          = "../../../modules/project"
  billing_account = var.billing_account_id
  parent          = var.parent
  name            = var.fleet_project_id
  shared_vpc_service_config = {
    attach       = true
    host_project = module.host_project.project_id
    service_identity_iam = {
      "roles/compute.networkUser" = [
        "cloudservices", "container-engine"
      ]
      "roles/container.hostServiceAgentUser" = [
        "container-engine"
      ]
    }
  }
  services = [
    "anthos.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "container.googleapis.com",
    "gkehub.googleapis.com",
    "gkeconnect.googleapis.com",
    "logging.googleapis.com",
    "mesh.googleapis.com",
    "monitoring.googleapis.com",
    "stackdriver.googleapis.com"
  ]
  iam = {
    "roles/container.admin"                     = [module.mgmt_server.service_account_iam_email]
    "roles/gkehub.admin"                        = [module.mgmt_server.service_account_iam_email]
    "roles/gkehub.serviceAgent"                 = ["serviceAccount:${module.fleet_project.service_accounts.robots.fleet}"]
    "roles/monitoring.viewer"                   = local.np_service_account_iam_email
    "roles/monitoring.metricWriter"             = local.np_service_account_iam_email
    "roles/logging.logWriter"                   = local.np_service_account_iam_email
    "roles/stackdriver.resourceMetadata.writer" = local.np_service_account_iam_email
  }
  service_config = {
    disable_on_destroy         = false
    disable_dependent_services = true
  }
}

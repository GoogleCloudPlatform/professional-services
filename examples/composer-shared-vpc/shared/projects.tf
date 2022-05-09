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

data "google_active_folder" "composer_e2e" {
  display_name = var.folder_name
  parent       = format("%s/%s", "organizations", var.org_id)
}

/***********************************
Create host project for Shared VPC
************************************/
module "project-networking" {
  source                         = "terraform-google-modules/project-factory/google"
  version                        = "~> 11.1.1"
  name                           = "${var.prefix}-comp-shared-vpc"
  disable_services_on_destroy    = false
  folder_id                      = data.google_active_folder.composer_e2e.name
  org_id                         = var.org_id
  billing_account                = var.billing_account
  enable_shared_vpc_host_project = true
  activate_apis = [
    "compute.googleapis.com",
    "dns.googleapis.com",
    "container.googleapis.com",
    "logging.googleapis.com",
  ]
  labels = {
    application-name = "vpc-host"
  }
}

/****************************************
Create Service project for Composer Envs
*****************************************/
module "project-composer" {
  source                      = "terraform-google-modules/project-factory/google"
  version                     = "~> 11.1.1"
  name                        = "${var.prefix}-comp-envs"
  disable_services_on_destroy = false
  folder_id                   = data.google_active_folder.composer_e2e.name
  org_id                      = var.org_id
  billing_account             = var.billing_account
  svpc_host_project_id        = "${var.prefix}-comp-shared-vpc"
  activate_apis = [
    "compute.googleapis.com",
    "container.googleapis.com",
    "composer.googleapis.com",
    "logging.googleapis.com"
  ]
  labels = {
    application-name = "composer-envs"
  }
  depends_on = [
    module.project-networking
  ]
}

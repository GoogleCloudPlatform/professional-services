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
  service_accounts = { for sa in var.service_accounts : sa.name => sa }
}

module "project" {
  source         = "../../../modules/project"
  name           = var.project_id
  project_create = var.project_create
  services       = var.services
}

module "integration-sa" {
  source     = "../../../modules/iam-service-account"
  for_each   = local.service_accounts
  project_id = module.project.project_id
  name       = each.value.name
  iam_project_roles = {
    (module.project.project_id) = each.value.iam_project_roles
  }
  public_keys_directory = each.value.public_keys_path
}

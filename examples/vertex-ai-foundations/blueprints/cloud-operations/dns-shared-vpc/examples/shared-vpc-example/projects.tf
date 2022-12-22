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

# root folder
module "folder" {
  source = "../../../../modules/folder"
  parent = "organizations/${var.organization_id}"
  name   = var.prefix
}

# Generating a random id for project ids
resource "random_id" "id" {
  byte_length = 4
}

# Creating the host project
module "project-host" {
  source = "../../../../modules/project"

  parent          = module.folder.id
  billing_account = var.billing_account
  prefix          = var.prefix
  name            = "${random_id.id.hex}-${var.host_project}"
  services        = var.project_services

  shared_vpc_host_config = {
    enabled = true
  }
}

# Note that by default, this module doesn't create the default Network.
module "project-service-1" {
  source = "../../../../modules/project"

  parent          = module.folder.id
  billing_account = var.billing_account
  prefix          = var.prefix
  name            = "${random_id.id.hex}-${var.service_projects[0]}"
  services        = var.project_services

  shared_vpc_service_config = {
    attach       = true
    host_project = module.project-host.project_id
  }
}

module "project-service-2" {
  source = "../../../../modules/project"

  parent          = module.folder.id
  billing_account = var.billing_account
  prefix          = var.prefix
  name            = "${random_id.id.hex}-${var.service_projects[1]}"
  services        = var.project_services

  shared_vpc_service_config = {
    attach       = true
    host_project = module.project-host.project_id
  }
}

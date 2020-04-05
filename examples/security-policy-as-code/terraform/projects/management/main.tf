/**
 * Copyright 2019 Google LLC
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

data "terraform_remote_state" "project_network" {
  backend = "gcs"

  config = {
    bucket = var.remote_state_bucket
    prefix = "terraform/state/network"
  }
}

module "project_management" {
  source  = "terraform-google-modules/project-factory/google"
  version = "~> 6.2.1"

  name   = local.project_management
  org_id = var.org_id

  domain          = var.domain
  billing_account = var.billing_account
  folder_id       = local.folder_id

  shared_vpc         = data.terraform_remote_state.project_network.outputs.project_id
  shared_vpc_subnets = ["projects/${local.project_network}/regions/${var.region}/subnetworks/${local.mgmt_subnet_name}"]

  activate_apis = [
    "compute.googleapis.com",
  ]
}

output project_id {
  value = module.project_management.project_id
}

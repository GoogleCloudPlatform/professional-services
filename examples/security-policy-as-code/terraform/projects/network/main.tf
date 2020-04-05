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

module "project_network" {
  source  = "terraform-google-modules/project-factory/google"
  version = "~> 6.2.1"

  name                        = local.project_network
  org_id                      = var.org_id
  domain                      = var.domain
  billing_account             = var.billing_account
  folder_id                   = local.folder_id
  disable_services_on_destroy = "false"

  activate_apis = [
    "compute.googleapis.com",
    "container.googleapis.com",
  ]
}


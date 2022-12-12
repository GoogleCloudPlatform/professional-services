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

module "shared-vpc" {
  source = "../../../../modules/net-vpc"

  project_id = module.project-host.project_id
  name       = "shared-vpc"

  subnets = [
    {
      name          = "subnet-01"
      ip_cidr_range = "10.10.1.0/24"
      region        = var.region
    }
  ]
}

# cloud DNS configuration
module "cloud-dns" {
  source = "../../"

  billing_account = var.billing_account
  folder_id       = module.folder.id
  shared_vpc_link = module.shared-vpc.self_link

  teams      = var.teams
  dns_domain = var.dns_domain
}

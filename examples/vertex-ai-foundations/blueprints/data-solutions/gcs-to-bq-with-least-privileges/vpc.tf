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

module "vpc" {
  source     = "../../../modules/net-vpc"
  count      = local.use_shared_vpc ? 0 : 1
  project_id = module.project.project_id
  name       = "${var.prefix}-vpc"
  subnets = [
    {
      ip_cidr_range = var.vpc_subnet_range
      name          = "subnet"
      region        = var.region
    }
  ]
}

module "vpc-firewall" {
  source     = "../../../modules/net-vpc-firewall"
  count      = local.use_shared_vpc ? 0 : 1
  project_id = module.project.project_id
  network    = module.vpc[0].name
  default_rules_config = {
    admin_ranges = [var.vpc_subnet_range]
  }
}

module "nat" {
  source         = "../../../modules/net-cloudnat"
  count          = local.use_shared_vpc ? 0 : 1
  project_id     = module.project.project_id
  region         = var.region
  name           = "${var.prefix}-default"
  router_network = module.vpc[0].name
}

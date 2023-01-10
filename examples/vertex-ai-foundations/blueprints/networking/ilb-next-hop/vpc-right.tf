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

module "vpc-right" {
  source     = "../../../modules/net-vpc"
  project_id = module.project.project_id
  name       = "${local.prefix}right"
  subnets = [
    {
      ip_cidr_range = var.ip_ranges.right
      name          = "${local.prefix}right"
      region        = var.region
    },
  ]
  routes = {
    to-left-ilb = {
      dest_range    = var.ip_ranges.left
      priority      = var.ilb_right_enable ? 900 : 1100
      next_hop_type = "ilb"
      next_hop      = module.ilb-right.forwarding_rule.self_link
    }
    to-left-gw-1 = {
      dest_range    = var.ip_ranges.left
      next_hop_type = "instance"
      next_hop      = module.gw[var.zones[0]].self_link
    }
    to-left-gw-2 = {
      dest_range    = var.ip_ranges.left
      next_hop_type = "instance"
      next_hop      = module.gw[var.zones[1]].self_link
    }
  }
}

module "firewall-right" {
  source     = "../../../modules/net-vpc-firewall"
  project_id = module.project.project_id
  network    = module.vpc-right.name
  default_rules_config = {
    admin_ranges = values(var.ip_ranges)
    ssh_ranges   = ["35.235.240.0/20", "35.191.0.0/16", "130.211.0.0/22"]
  }
}

module "nat-right" {
  source         = "../../../modules/net-cloudnat"
  project_id     = module.project.project_id
  region         = var.region
  name           = "${local.prefix}right"
  router_network = module.vpc-right.name
}

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

# tfdoc:file:description Networking resources.

module "svpc" {
  source     = "../../../modules/net-vpc"
  project_id = module.host_project.project_id
  name       = "svpc"
  mtu        = 1500
  subnets = concat([for key, config in var.clusters_config : {
    ip_cidr_range = config.subnet_cidr_block
    name          = "subnet-${key}"
    region        = var.region
    secondary_ip_ranges = {
      pods     = config.pods_cidr_block
      services = config.services_cidr_block
    }
    }], [{
    ip_cidr_range = var.mgmt_subnet_cidr_block
    name          = "subnet-mgmt"
    region        = var.mgmt_server_config.region
  }])
}

module "firewall" {
  source     = "../../../modules/net-vpc-firewall"
  project_id = module.host_project.project_id
  network    = module.svpc.name
  ingress_rules = merge(
    {
      allow-mesh = {
        description = "Allow mesh."
        priority    = 900
        source_ranges = [
          for k, v in var.clusters_config : v.pods_cidr_block
        ]
        targets = [
          for k, v in var.clusters_config : "${k}-node"
        ]
        rules = [
          { protocol = "tcp" },
          { protocol = "udp" },
          { protocol = "icmp" },
          { protocol = "esp" },
          { protocol = "ah" },
          { protocol = "sctp" }
        ]
      }
    },
    {
      for k, v in var.clusters_config : "allow-${k}-istio" => {
        description   = "Allow istio."
        source_ranges = [v.master_cidr_block]
        targets       = ["${k}-node"]
        rules = [{
          protocol = "tcp"
          ports    = [8080, 15014, 15017]
        }]
      }
    }
  )
}

module "nat" {
  source         = "../../../modules/net-cloudnat"
  project_id     = module.host_project.project_id
  region         = var.region
  name           = "nat"
  router_create  = true
  router_network = module.svpc.name
}


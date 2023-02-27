# Copyright 2023 Google LLC All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

module "cluster" {
 source = "../modules/google_gdce_cluster"

  cluster-name = "test-cluster"
  project-id = var.project-id
  location = var.location
  cluster-ipv4-cidr = var.cluster-ipv4-cidr
  service-ipv4-cidr = var.service-ipv4-cidr
}

module "node-pool" {
  source = "../modules/google_gdce_node_pool"

  pool-name = "np-1"
  project-id = var.project-id
  location = var.location
  cluster-name = module.cluster.cluster-name
  node-location = var.node-location
  node-count = var.node-count

  depends_on = [module.cluster]
}

module "vpn-connection" {
  source = "../modules/google_gdce_vpn_connection"

  vpn-connection-name = "vpn-1"
  project-id = var.project-id
  location = var.location
  cluster-name = module.cluster.cluster-name
  vpc-network-name = "default"

  depends_on = [module.node-pool]
}
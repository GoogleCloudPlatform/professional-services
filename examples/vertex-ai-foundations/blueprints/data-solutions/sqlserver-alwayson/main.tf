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

locals {
  ad_user_password_secret = "${local.cluster_full_name}-password"
  cluster_full_name       = "${local.prefix}${var.cluster_name}"
  cluster_netbios_name = (
    length(local.cluster_full_name) > 15
    ? substr(local.cluster_full_name, 0, 15)
    : local.cluster_full_name
  )
  network   = module.vpc.self_link
  node_base = "${local.prefix}${var.node_name}"
  node_prefix = (
    length(local.node_base) > 12
    ? substr(local.node_base, 0, 12)
    : local.node_base
  )
  node_netbios_names = [
    for idx in range(1, 3) : format("%s-%02d", local.node_prefix, idx)
  ]
  node_zones = merge(
    {
      for idx, node_name in local.node_netbios_names :
      node_name => local.zones[idx]
    },
    {
      (local.witness_netbios_name) = local.zones[length(local.zones) - 1]
    }
  )
  prefix = var.prefix != "" ? "${var.prefix}-" : ""
  subnetwork = (
    var.project_create != null
    ? module.vpc.subnet_self_links["${var.region}/${var.subnetwork}"]
    : data.google_compute_subnetwork.subnetwork[0].self_link
  )
  vpc_project = (
    var.shared_vpc_project_id != null
    ? var.shared_vpc_project_id
    : module.project.project_id
  )
  witness_name = "${local.prefix}${var.witness_name}"
  witness_netbios_name = (
    length(local.witness_name) > 15
    ? substr(local.witness_name, 0, 15)
    : local.witness_name
  )
  zones = (
    var.project_create == null
    ? data.google_compute_zones.zones[0].names
    : formatlist("${var.region}-%s", ["a", "b", "c"])
  )
}

module "project" {
  source          = "../../../modules/project"
  name            = var.project_id
  parent          = try(var.project_create.parent, null)
  billing_account = try(var.project_create.billing_account_id, null)
  project_create  = var.project_create != null
  prefix          = var.project_create == null ? null : var.prefix
  services = [
    "compute.googleapis.com",
    "secretmanager.googleapis.com",
  ]

  iam          = {}
  iam_additive = {}
  shared_vpc_service_config = var.shared_vpc_project_id == null ? null : {
    attach       = true
    host_project = var.shared_vpc_project_id
  }
}

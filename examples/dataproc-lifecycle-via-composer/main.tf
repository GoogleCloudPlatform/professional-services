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
  _shared_vpc_bindings = {
    "roles/compute.networkUser" = [
      "sa-composer"
    ]
    "roles/composer.sharedVpcAgent" = [
      "sa-composer"
    ]
    "roles/container.hostServiceAgentUser" = [
      "sa-composer"
    ]
  }
  shared_vpc_bindings_map = {
    for binding in flatten([
      for role, members in local._shared_vpc_bindings : [
        for member in members : { role = role, member = member }
      ]
    ]) : "${binding.role}-${binding.member}" => binding
  }
  shared_vpc_project = try(var.network_config.host_project, null)
  shared_vpc_role_members = {
    sa-composer = "serviceAccount:${module.service-account.email}"
  }
  subnet = (
    local.use_shared_vpc
    ? var.network_config.subnet_self_link
    : values(module.vpc.0.subnet_self_links)[0]
  )
  use_shared_vpc = var.network_config != null
  vpc_self_link = (
    local.use_shared_vpc
    ? var.network_config.network_self_link
    : module.vpc.0.self_link
  )
}

resource "google_project_iam_member" "shared_vpc" {
  for_each = local.use_shared_vpc ? local.shared_vpc_bindings_map : {}
  project  = var.network_config.host_project
  role     = each.value.role
  member   = lookup(local.shared_vpc_role_members, each.value.member)
}

module "service-account" {
  source     = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/iam-service-account"
  project_id = var.project_id
  name       = var.service_account
  iam_project_roles = {
    (var.project_id) = [
      "roles/composer.worker",
      "roles/dataproc.admin",
      "roles/iam.serviceAccountUser"
    ]
  }
}

module "firewall" {
  source     = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/net-vpc-firewall"
  project_id = local.use_shared_vpc ? var.network_config.host_project : var.project_id
  network    = local.use_shared_vpc ? var.network_config.name : module.vpc.0.name
  default_rules_config = {
    admin_ranges = ["10.128.0.0/20"]
    }
}

module "vpc" {
  source     = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/net-vpc"
  count      = local.use_shared_vpc ? 0 : 1
  project_id = var.project_id
  name       = "dataproc-lifecycle-vpc"
  subnets = [
    {
      ip_cidr_range      = "10.128.0.0/20"
      name               = "dataproc-lifecycle-subnet"
      region             = var.region
      secondary_ip_range = {}
    }
  ]
}
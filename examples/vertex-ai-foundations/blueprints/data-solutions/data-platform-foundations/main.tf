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

# tfdoc:file:description Core locals.

locals {
  # we cannot reference service accounts directly as they are dynamic
  _shared_vpc_bindings = {
    "roles/compute.networkUser" = [
      "load-robot-df", "load-sa-df-worker",
      "orch-cloudservices", "orch-robot-df", "orch-robot-gke",
      "transf-robot-df", "transf-sa-df-worker",
    ]
    "roles/composer.sharedVpcAgent" = [
      "orch-robot-cs"
    ]
    "roles/container.hostServiceAgentUser" = [
      "orch-robot-df", "orch-robot-gke"
    ]
  }
  groups = {
    for k, v in var.groups : k => "${v}@${var.organization_domain}"
  }
  groups_iam = {
    for k, v in local.groups : k => "group:${v}"
  }
  project_suffix          = var.project_suffix == null ? "" : "-${var.project_suffix}"
  service_encryption_keys = var.service_encryption_keys
  shared_vpc_project      = try(var.network_config.host_project, null)
  # this is needed so that for_each only uses static values
  shared_vpc_role_members = {
    load-robot-df       = "serviceAccount:${module.load-project.service_accounts.robots.dataflow}"
    load-sa-df-worker   = module.load-sa-df-0.iam_email
    orch-cloudservices  = "serviceAccount:${module.orch-project.service_accounts.cloud_services}"
    orch-robot-cs       = "serviceAccount:${module.orch-project.service_accounts.robots.composer}"
    orch-robot-df       = "serviceAccount:${module.orch-project.service_accounts.robots.dataflow}"
    orch-robot-gke      = "serviceAccount:${module.orch-project.service_accounts.robots.container-engine}"
    transf-robot-df     = "serviceAccount:${module.transf-project.service_accounts.robots.dataflow}"
    transf-sa-df-worker = module.transf-sa-df-0.iam_email
  }
  # reassemble in a format suitable for for_each
  shared_vpc_bindings_map = {
    for binding in flatten([
      for role, members in local._shared_vpc_bindings : [
        for member in members : { role = role, member = member }
      ]
    ]) : "${binding.role}-${binding.member}" => binding
  }
  use_shared_vpc = var.network_config != null
}

resource "google_project_iam_member" "shared_vpc" {
  for_each = local.use_shared_vpc ? local.shared_vpc_bindings_map : {}
  project  = var.network_config.host_project
  role     = each.value.role
  member   = lookup(local.shared_vpc_role_members, each.value.member)
}

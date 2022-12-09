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
  iam = {
    # GCS roles
    "roles/storage.objectAdmin" = [
      module.service-account-df.iam_email,
      module.service-account-landing.iam_email
    ],
    "roles/storage.objectViewer" = [
      module.service-account-orch.iam_email,
    ],
    # BigQuery roles
    "roles/bigquery.admin" = concat([
      module.service-account-orch.iam_email,
      ], var.data_eng_principals
    )
    "roles/bigquery.dataEditor" = [
      module.service-account-df.iam_email,
      module.service-account-bq.iam_email
    ]
    "roles/bigquery.dataViewer" = [
      module.service-account-bq.iam_email,
      module.service-account-orch.iam_email
    ]
    "roles/bigquery.jobUser" = [
      module.service-account-df.iam_email,
      module.service-account-bq.iam_email
    ]
    "roles/bigquery.user" = [
      module.service-account-bq.iam_email,
      module.service-account-df.iam_email
    ]
    # common roles
    "roles/logging.admin" = var.data_eng_principals
    "roles/logging.logWriter" = [
      module.service-account-bq.iam_email,
      module.service-account-landing.iam_email,
      module.service-account-orch.iam_email,
    ]
    "roles/monitoring.metricWriter" = [
      module.service-account-bq.iam_email,
      module.service-account-landing.iam_email,
      module.service-account-orch.iam_email,
    ]
    "roles/iam.serviceAccountUser" = [
      module.service-account-orch.iam_email,
    ]
    "roles/iam.serviceAccountTokenCreator" = concat(
      var.data_eng_principals
    )
    # Dataflow roles
    "roles/dataflow.admin" = concat(
      [module.service-account-orch.iam_email],
      var.data_eng_principals
    )
    "roles/dataflow.worker" = [
      module.service-account-df.iam_email,
    ]
    "roles/dataflow.developer" = var.data_eng_principals
    "roles/compute.viewer"     = var.data_eng_principals
    # network roles
    "roles/compute.networkUser" = [
      module.service-account-df.iam_email,
      "serviceAccount:${module.project.service_accounts.robots.dataflow}"
    ]
  }
  network_subnet_selflink = try(
    module.vpc[0].subnets["${var.region}/subnet"].self_link,
    var.network_config.subnet_self_link
  )
  shared_vpc_bindings = {
    "roles/compute.networkUser" = [
      "robot-df", "sa-df-worker"
    ]
  }
  # reassemble in a format suitable for for_each
  shared_vpc_bindings_map = {
    for binding in flatten([
      for role, members in local.shared_vpc_bindings : [
        for member in members : { role = role, member = member }
      ]
    ]) : "${binding.role}-${binding.member}" => binding
  }
  shared_vpc_project = try(var.network_config.host_project, null)
  shared_vpc_role_members = {
    robot-df     = "serviceAccount:${module.project.service_accounts.robots.dataflow}"
    sa-df-worker = module.service-account-df.iam_email
  }
  use_shared_vpc = var.network_config != null
}

module "project" {
  source          = "../../../modules/project"
  name            = var.project_id
  parent          = try(var.project_create.parent, null)
  billing_account = try(var.project_create.billing_account_id, null)
  project_create  = var.project_create != null
  prefix          = var.project_create == null ? null : var.prefix
  services = [
    "bigquery.googleapis.com",
    "bigquerystorage.googleapis.com",
    "bigqueryreservation.googleapis.com",
    "cloudkms.googleapis.com",
    "compute.googleapis.com",
    "dataflow.googleapis.com",
    "servicenetworking.googleapis.com",
    "storage.googleapis.com",
    "storage-component.googleapis.com",
  ]

  # additive IAM bindings avoid disrupting bindings in existing project
  iam          = var.project_create != null ? local.iam : {}
  iam_additive = var.project_create == null ? local.iam : {}
  shared_vpc_service_config = local.shared_vpc_project == null ? null : {
    attach       = true
    host_project = local.shared_vpc_project
  }
}

resource "google_project_iam_member" "shared_vpc" {
  for_each = local.use_shared_vpc ? local.shared_vpc_bindings_map : {}
  project  = var.network_config.host_project
  role     = each.value.role
  member   = lookup(local.shared_vpc_role_members, each.value.member)
}

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

# tfdoc:file:description Dev spoke VPC and related resources.

module "dev-spoke-project" {
  source          = "../modules/project"
  billing_account = var.billing_account.id
  name            = "dev-net-spoke-0"
  parent          = var.folder_ids.networking-dev
  prefix          = var.prefix
  services = [
    "container.googleapis.com",
    "compute.googleapis.com",
    "dns.googleapis.com",
    "iap.googleapis.com",
    "networkmanagement.googleapis.com",
    "servicenetworking.googleapis.com",
    "stackdriver.googleapis.com",
  ]
  shared_vpc_host_config = {
    enabled = true
  }
  metric_scopes = [module.common-project.project_id]
  iam = {
    "roles/dns.admin" = compact([
      try(local.service_accounts.gke-dev, null),
      try(local.service_accounts.project-factory-dev, null),
    ])
  }
}

module "dev-spoke-vpc" {
  source             = "../modules/net-vpc"
  project_id         = module.dev-spoke-project.project_id
  name               = "dev-spoke-0"
  mtu                = 1500
  data_folder        = "${var.data_dir}/subnets/dev"
  psa_config         = try(var.psa_ranges.dev, null)
  subnets_proxy_only = local.l7ilb_subnets.dev
  # set explicit routes for googleapis in case the default route is deleted
  routes = {
    private-googleapis = {
      dest_range    = "199.36.153.8/30"
      next_hop_type = "gateway"
      next_hop      = "default-internet-gateway"
    }
    restricted-googleapis = {
      dest_range    = "199.36.153.4/30"
      next_hop_type = "gateway"
      next_hop      = "default-internet-gateway"
    }
  }
}

module "dev-spoke-firewall" {
  source     = "../modules/net-vpc-firewall"
  project_id = module.dev-spoke-project.project_id
  network    = module.dev-spoke-vpc.name
  default_rules_config = {
    disabled = true
  }
  factories_config = {
    cidr_tpl_file = "${var.data_dir}/cidrs.yaml"
    rules_folder  = "${var.data_dir}/firewall-rules/dev"
  }
}

module "dev-spoke-cloudnat" {
  for_each       = toset(values(module.dev-spoke-vpc.subnet_regions))
  source         = "../modules/net-cloudnat"
  project_id     = module.dev-spoke-project.project_id
  region         = each.value
  name           = "dev-nat-${var.region_trigram[each.value]}"
  router_create  = true
  router_network = module.dev-spoke-vpc.name
  router_asn     = 4200001024
  logging_filter = "ERRORS_ONLY"
}

# Create delegated grants for stage3 service accounts
resource "google_project_iam_binding" "dev_spoke_project_iam_delegated" {
  project = module.dev-spoke-project.project_id
  role    = "roles/resourcemanager.projectIamAdmin"
  members = compact([
    try(local.service_accounts.data-platform-dev, null),
    try(local.service_accounts.project-factory-dev, null),
    try(local.service_accounts.gke-dev, null),
  ])
  condition {
    title       = "dev_stage3_sa_delegated_grants"
    description = "Development host project delegated grants."
    expression = format(
      "api.getAttribute('iam.googleapis.com/modifiedGrantsByRole', []).hasOnly([%s])",
      join(",", formatlist("'%s'", local.stage3_sas_delegated_grants))
    )
  }
}

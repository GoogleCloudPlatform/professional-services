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

locals {
  projects = {
    for k, v in module.project : k => v.project_id
  }
  svpc_project_id = regex("/projects/(.*?)/.*", var.shared_vpc_link)[0]
}

module "project" {
  source          = "../../../modules/project"
  for_each        = toset(var.teams)
  billing_account = var.billing_account_id
  name            = each.value
  parent          = var.folder_id
  prefix          = var.prefix
  services        = var.project_services
}

module "vpc" {
  source     = "../../../modules/net-vpc"
  for_each   = local.projects
  project_id = each.value
  name       = "dns-vpc"
}

module "dns-private" {
  source          = "../../../modules/dns"
  for_each        = local.projects
  project_id      = each.value
  type            = "private"
  name            = each.key
  domain          = "${each.key}.${var.dns_domain}."
  description     = "DNS zone for ${each.key}"
  client_networks = [module.vpc[each.key].self_link]
}

module "dns-peering" {
  source          = "../../../modules/dns"
  for_each        = local.projects
  project_id      = local.svpc_project_id
  name            = "peering-${each.key}"
  domain          = "${each.key}.${var.dns_domain}."
  description     = "DNS peering for ${each.key}"
  type            = "peering"
  peer_network    = module.vpc[each.key].self_link
  client_networks = [var.shared_vpc_link]
}

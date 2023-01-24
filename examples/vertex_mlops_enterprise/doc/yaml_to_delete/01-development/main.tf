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

# tfdoc:file:description Project factory.

module "projects" {
  source                 = "../modules/ml-project-factory-module"
  for_each               = local.projects
  defaults               = local.defaults
  project_id             = each.key
  artifact_registry      = try(each.value.artifact_registry, {})
  billing_account_id     = try(each.value.billing_account_id, null)
  billing_alert          = try(each.value.billing_alert, null)
  buckets                = try(each.value.buckets, {})
  datasets               = try(each.value.datasets, {})
  dns_zones              = try(each.value.dns_zones, [])
  essential_contacts     = try(each.value.essential_contacts, [])
  folder_id              = each.value.folder_id
  group_iam              = try(each.value.group_iam, {})
  iam                    = try(each.value.iam, {})
  kms_service_agents     = try(each.value.kms, {})
  labels                 = try(each.value.labels, {})
  notebooks              = try(each.value.notebooks, {})
  org_policies           = try(each.value.org_policies, null)
  prefix                 = var.prefix
  repo_name              = try(each.value.repo_name, null)
  service_accounts       = try(each.value.service_accounts, {})
  service_accounts_iam   = try(each.value.service_accounts_iam, {})
  secrets                = try(each.value.secrets, {})
  secrets_iam            = try(each.value.secrets_iam, {})
  services               = try(each.value.services, [])
  service_identities_iam = try(each.value.services_iam, {})
  vpc                    = try(each.value.vpc, null)
  vpc_local              = try(each.value.vpc_local, null)
  workload_identity      = try(each.value.workload_identity, null)
}

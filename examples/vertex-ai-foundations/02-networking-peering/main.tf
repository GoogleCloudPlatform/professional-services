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

# tfdoc:file:description Networking folder and hierarchical policy.

locals {
  custom_roles = coalesce(var.custom_roles, {})
  l7ilb_subnets = {
    for env, v in var.l7ilb_subnets : env => [
      for s in v : merge(s, {
        active = true
        name   = "${env}-l7ilb-${s.region}"
    })]
  }
  stage3_sas_delegated_grants = [
    "roles/composer.sharedVpcAgent",
    "roles/compute.networkUser",
    "roles/compute.networkViewer",
    "roles/container.hostServiceAgentUser",
    "roles/multiclusterservicediscovery.serviceAgent",
    "roles/vpcaccess.user",
  ]
  service_accounts = {
    for k, v in coalesce(var.service_accounts, {}) :
    k => "serviceAccount:${v}" if v != null
  }
}

module "folder" {
  source        = "../modules/folder"
  parent        = "organizations/${var.organization.id}"
  name          = "Networking"
  folder_create = var.folder_ids.networking == null
  id            = var.folder_ids.networking
  firewall_policy_factory = {
    cidr_file   = "${var.data_dir}/cidrs.yaml"
    policy_name = null
    rules_file  = "${var.data_dir}/hierarchical-policy-rules.yaml"
  }
  firewall_policy_association = {
    factory-policy = "factory"
  }
}


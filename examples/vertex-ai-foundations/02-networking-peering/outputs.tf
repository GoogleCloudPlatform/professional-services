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
  host_project_ids = {
    dev-spoke-0  = module.dev-spoke-project.project_id
    prod-common = module.common-project.project_id
    prod-spoke-0 = module.prod-spoke-project.project_id
  }
  host_project_numbers = {
    dev-spoke-0  = module.dev-spoke-project.number
    prod-common = module.common-project.number
    prod-spoke-0 = module.prod-spoke-project.number
  }
  subnet_self_links = {
    prod-common = module.common-vpc.subnet_self_links
    dev-spoke-0  = module.dev-spoke-vpc.subnet_self_links
    prod-spoke-0 = module.prod-spoke-vpc.subnet_self_links
  }
  tfvars = {
    host_project_ids     = local.host_project_ids
    host_project_numbers = local.host_project_numbers
    subnet_self_links    = local.subnet_self_links
    vpc_self_links       = local.vpc_self_links
  }
  vpc_self_links = {
    prod-common = module.common-vpc.self_link
    dev-spoke-0  = module.dev-spoke-vpc.self_link
    prod-spoke-0 = module.prod-spoke-vpc.self_link
  }
}

# generate tfvars file for subsequent stages

resource "local_file" "tfvars" {
  for_each        = var.outputs_location == null ? {} : { 1 = 1 }
  file_permission = "0644"
  filename        = "${pathexpand(var.outputs_location)}/tfvars/02-networking.auto.tfvars.json"
  content         = jsonencode(local.tfvars)
}

resource "google_storage_bucket_object" "tfvars" {
  bucket  = var.automation.outputs_bucket
  name    = "tfvars/02-networking.auto.tfvars.json"
  content = jsonencode(local.tfvars)
}

# outputs

output "cloud_dns_inbound_policy" {
  description = "IP Addresses for Cloud DNS inbound policy."
  value       = [for s in module.common-vpc.subnets : cidrhost(s.ip_cidr_range, 2)]
}

output "host_project_ids" {
  description = "Network project ids."
  value       = local.host_project_ids
}

output "host_project_numbers" {
  description = "Network project numbers."
  value       = local.host_project_numbers
}

output "shared_vpc_self_links" {
  description = "Shared VPC host projects."
  value       = local.vpc_self_links
}

output "vpn_gateway_endpoints" {
  description = "External IP Addresses for the GCP VPN gateways."
  value = local.enable_onprem_vpn == false ? null : {
    onprem-usc1 = {
      for v in module.common-to-onprem-usc1-vpn[0].gateway.vpn_interfaces :
      v.id => v.ip_address
    }
  }
}

output "tfvars" {
  description = "Terraform variables file for the following stages."
  sensitive   = true
  value       = local.tfvars
}
